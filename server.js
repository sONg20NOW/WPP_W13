// 서버 측에서 이뤄지는 일들

import { error } from "console";
import { Socket } from "dgram";
import { createServer } from "net";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

const routes = {
    GET: {
        "/": "<h1>Hello World</h1>",
        "/about": "<h1>About Us</h1><p>This is the about page.</p>",
        "/contact": "<h1>Contact Us</h1><p>Contact details here.</p>",
    },
};

const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".png": "image/png",
    ".jpg": "image/jpeg",
};

const create404Error = () => {
    const errorContent = "<h1>404 Not Found</h1>";
    const responseHeader = createHttpResponseHeader(
        404,
        "Not Found",
        {
            "Content-Type": "text/html",
            "Content-Length": errorContent.length,
        },
        errorContent
    );
    return responseHeader;
}

const playlist = [
    {artist: "The Kinks", song: "You Really Got Me"},
    {artist: "Bjork", song: "Venus As A Boy"},
];

const extractSessionId = (cookie) => {
    const pairs = cookie.split(";");

    for (const pair of pairs) {
        const [key, value] = pair.split("=");
        if (key.trim() == "sessionId") {
            return value.trim();
        }
    }

    return null;
};

const handleGet = (socket, reqPath, headers) => {
    const filePath = path.join(
        __dirname,
        "public",
        reqPath == "/" ? "index.html" : reqPath
    );
    if (reqPath == "/logout") {
        const sessionId = extractSessionId(headers.Cookie);

        console.log(sessionId);
        console.log(sessions);
        delete sessions[sessionId];
        
        const content = "<h1>Logout successful</h1>";
        const responseHeader = createHttpResponseHeader(200, "OK",
            {
                "Content-Type": "text/html",
                "Content-Length": Buffer.byteLength(content),
                "Set-Cookie": `sessionId=; HttpOnly; Max-Age=0`,
            }
        );
        socket.write(responseHeader);
        socket.write(content);
        socket.end();
        return;
    }

    else if (reqPath == "/secret") {
        const sessionId = extractSessionId(headers.Cookie);
        console.log("sessionId: ", sessionId);

        // 만약 sessionId가 유효하다면
        if (sessions[sessionId]) {
            const content = "<h1>Secret Page</h1>";
            const responseHeader = createHttpResponseHeader(
                200,
                "OK",
                {
                    "Content-Type": "text/html",
                    "Content-Length": Buffer.byteLength(content),
                });
            socket.write(responseHeader);
            socket.write(content);
        }
        // sessionId가 유효하지 않은 경우
        else {
            const content = "<h1>You Are Not Allowed. Please Login</h1>";
            const responseHeader = createHttpResponseHeader(
                401,
                "Unauthorized",
                {
                    "Content-Type": "text/html",
                    "Content-Length": Buffer.byteLength(content),
                }
            );
            socket.write(responseHeader);
            socket.write(content);
        }

        socket.end();
        return;
    }

    // SSR
    else if (reqPath == "/playlist") {
        let content = "<h1>Playlist</h1>";
        content += "<ul>";
        for (const song of playlist) {
            content += `<li>${song.artist} - ${song.song}</li>`;
        }
        content += "</ul>";

        const responseHeader = createHttpResponseHeader(200, "OK", 
            {
                "Content-Type": "text/html",
                "Content-Length": Buffer.byteLength(content),
            }
        );
        socket.write(responseHeader);
        socket.write(content);
        socket.end();

        return;
    }
    // CSR
    else if (reqPath == "/api/playlist") {
        const content = JSON.stringify(playlist);
        const responseHeader = createHttpResponseHeader(200, "OK",
            {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(content),
            }
        );
        socket.write(responseHeader);
        socket.write(content);
        socket.end();
        return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || "application/octet-stream";

    // {}.html 형식일 때 해당 파일의 컨텐츠로 response 생성, 전달.
    fs.readFile(filePath, (err, content) => {
        if (!err) {
            const responseHeader = createHttpResponseHeader(
                200,
                "OK",
                {
                    "Content-Type": contentType,
                    "Content-Length": content.length,
                },
            );
            socket.write(responseHeader);
            socket.write(content);

            socket.end();   
        } else {
            const response = create404Error();
            socket.write(response);
            socket.end();
        }
    });
};

const users = {
    user: "1234",
};

const sessions = {};

const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15);
}

const server = createServer((socket) => {
    // 클라이언트로부터 "data" 이벤트 수신
    socket.on("data", (data) => {
        const parsedHTTP = parseHttpRequest(data);
        // console.log("<<ParsedHTTP>>:\n", parsedHTTP);
        const {method, path: reqPath, headers, body} = parsedHTTP;
        
        if (method == "GET") {
            handleGet(socket, reqPath, headers);
        } else if (method == "POST") {
            if (reqPath == "/login") {
                const params = new URLSearchParams(body);
                const username = params.get("username");
                const password = params.get("password");

                if (users[username] && users[username] == password ) {
                    const sessionId = generateSessionId();
                    sessions[sessionId] = username;

                    const content = "<h1>Login successful</h1>";
                    const responseHeader = createHttpResponseHeader(
                        200,
                        "OK",
                        {
                            "Content-Type": "text/html",
                            "Content-Length": Buffer.byteLength(content),
                            "Set-Cookie": `sessionId=${sessionId}; HttpOnly; Max-Age=3600`,
                        });
                        socket.write(responseHeader);
                        socket.write(content);
                } else {
                    const response = createHttpResponseHeader(
                        401,
                        "Unathorized",
                        {
                            "Content-Type": "text/plain",
                        });
                        socket.write(response);
                    }
            } else if (reqPath == "/playlist") {
                const params = new URLSearchParams(body);
                const artist = params.get("artist");
                const song = params.get("song");

                const newSong = {artist: artist, song: song};

                playlist.push(newSong);

                const content = "<h1>Add song successful</h1>";
                const responseHeader = createHttpResponseHeader(
                    200,
                    "OK",
                    {
                        "Content-Type": "text/html",
                        "Content-length": Buffer.byteLength(content)
                    },
                )
                socket.write(responseHeader);
                socket.write(content);
                socket.end();                

            } else {
                const response = create404Error();
            }
        }
    });
        
    // 클라이언트로부터 "end" 이벤트 수신
    socket.on("end", () => {
        console.log("Connection ended");
    });

    // 클라이언트로부터 "error" 이벤트 수신
    socket.on("error", (error) => {
        console.log("Error occurred");
        console.log(error);
    });
});

server.listen(PORT, () => {
    console.log(`Server is listening at port ${PORT}`);
});

function createHttpResponse(statusCode, statusMessage, headers, body) {
    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    for (const [key, value] of Object.entries(headers)) {
        response += `${key}: ${value}\r\n`;
    }
    response += `\r\n${body}`;
    return response;
}

function parseHttpRequest(data) {
    const request = data.toString();
    const [headerLines, ...bodyParts] = request.split("\r\n\r\n");
    const lines = headerLines.split("\r\n");
    const [method, path, version] = lines[0].split(" ");
    const headers = {};

    lines.slice(1).forEach((line) => {
        const [key, value] = line.split(": ");
        headers[key] = value;
    });

    const body = bodyParts.join("\r\n\r\n");

    return {method, path, version, headers, body};
}

function createHttpResponseHeader(statusCode, statusMessage, headers) {
    let response = `HTTP/1.1 ${statusCode} ${statusMessage}\r\n`;
    for (const [key, value] of Object.entries(headers)) {
        response += `${key}: ${value}\r\n`;
    }
    response += `\r\n`;
    return response;
}
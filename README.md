# HTTP
## HTTP Request
client to server
which includes:
* **Request Line**: Specifies the method, resource URL, and HTTP version (e.g., GET /index.html HTTP/1.1).
* **Headers**: Provide additional information (e.g., Host, User-Agent, Accept).
* **Body**: Optional, used mainly with methods like POST or PUT to send data.
<br><br><br>
   
## HTTP Response
server to client
which includes:
* **Status Line**: Includes the HTTP version, status code, and reason phrase (e.g., HTTP/1.1 200 OK).
* **Headers**: Provide metadata about the response (e.g., Content-Type, Content-Length, Set-Cookie).
* **Body**: Contains the requested resource or data (e.g., HTML content, JSON data).
<br><br><br>
   
## HTTP Request Method
1. GET
When user types URL
2. POST
When user input data
*contain input data to request body.*
<br><br><br>
   
  ---
  <br><br><br>

# SSR & CSR
## SSR (Server Side Rendering)
In the server, totally rendering the HTML and send it to client(browser)
<br><br><br>
   
## CSR (Client Side Rendering)
a.k.a. JSR (Javascript Rendering)
In the client, dynamically rendering the content using JS.
<br><br><br>
   
  --- 
  <br><br><br>

# Exercise
## Todo:
* Make /public/add-song.html.
* When artist and song is submitted, server store new data in DB.
* Visit ‘localhost:3000/playlist’ to check the result
<br><br><br>
   
## What I do:
1. design `add-song.html`.
It is similar with `login.html`.
```html
<html>
    <body>
        <h1>Add Song</h1>
        <form action="/playlist" method="POST">
            <label for="artist">Artist:</label>
            <input type="text" id="artist" name="artist" required /><br /><br />
            <label for="song">Song:</label>
            <input type="text" id="song" name="song" required /><br /><br />
            <button type="submit">Submit</button>
        </form>
    </body>
</html>
```
When user click the submit button, client send requset with  
method : POST  
reqPath : /playlist

2. Send response to client (against to client's requset)
extract input information from request's body.  
```js
const params = new URLSearchParams(body);
const artist = params.get("artist");
const song = params.get("song");
```
append new song data to `playlist`
```js
const newSong = {artist: artist, song: song};

playlist.push(newSong);
```

3. finally, send response.
```js
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
```

# Usage

> Run
```cmd
npm i && npm start
```
> Build

```cmd
npm i && npx electron-packager . --all --icon=download.ico
```

## Lib Usage

```javascript
const Downloader = require("./lib");

let fetch = new Downloader({
    audio:true,
    video:false
  },"[PLAYLIST_ID]",{audio:__dirname,video:null},"[API_KEY]");
  
  fetch.FetchAll().then(data=>{
    fetch.DownloadAll();
  }).catch(err=>{
      console.error(err);
  })
```

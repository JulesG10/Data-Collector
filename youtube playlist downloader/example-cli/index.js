const Downloader = require("./lib");
const path = require("path")


let down = new Downloader({video:false,audio:true},process.env.PLAYLIST_ID,{audio:path.resolve(__dirname,"music"),video:null},proccess.env.YOUTUBE_API_KEY);
down.FetchAll().then(e=>{
    down.DownloadAll();
})

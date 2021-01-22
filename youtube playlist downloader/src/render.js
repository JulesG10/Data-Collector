const fetcher = require("./fetcher");
const path = require("path");
const youtubedl = require("youtube-dl");
const homeDir = require('os').homedir();
const desktopDir = `${homeDir}/Videos`;
const cmd = require("child_process").exec;
const fs = require('fs');
const { DH_CHECK_P_NOT_PRIME } = require("constants");
const { clearInterval } = require("timers");
const { ipcRenderer } = require("electron");


document.addEventListener("click", (e) => {
    if (e.target instanceof HTMLAnchorElement) {
        e.preventDefault();
        cmd("start " + e.target.href, (err, stderr, stdout) => {

        });
    }
})

const playlistEl = document.getElementById("playlist");

const playV = document.getElementById("textplay");

let downPlay = false;
let Tdata = [];
let idPl;

playlistEl.addEventListener("click", () => {
    if (playV.value.length > 0 && !downPlay) {
        document.getElementById("list").innerHTML = "";
        new fetcher({}, playV.value).video().then(data => {
            if (data.length > 0 && data.error == undefined) {
                downPlay = true;
                Tdata = data;
                idPl = playV.value;
                playlistEl.style.background = "#14ab12";
                playlistEl.innerText = "Download playlist";
            }
            else{
                console.log(data.error);
            }
        })
    } else if (downPlay) {
        let idI = setInterval(()=>{
            if(!(document.getElementById("download").children.length>0)){
                cmd("start "+desktopDir,(err,stderr,stout)=>{
                    clearInterval(idI);
                    ipcRenderer.send("win:close");
                });
            }
        },1000)
        playlistEl.setAttribute("disabled",true);
        playV.value="";
        let videoFolder = path.resolve(desktopDir, "./Playlist Video " + new Date().toLocaleDateString().replace(/(\/)/g, "-") + " " + idPl);
        let audioFolder = path.resolve(desktopDir, "./Playlist Audio " + new Date().toLocaleDateString().replace(/(\/)/g, "-") + " " + idPl);
        if (!fs.existsSync(videoFolder)||!fs.existsSync(audioFolder)) {
            fs.mkdir(videoFolder,(err)=>{
                fs.mkdir(audioFolder,(err)=>{
                    Tdata.map(list => {
                        list.items.map(async item => {
                            return await Download(item.snippet.resourceId.videoId, path.resolve(videoFolder, convertToValidFilename(item.snippet.title) + ".mp4"),path.resolve(audioFolder, convertToValidFilename(item.snippet.title) + ".mp3"))
                        })
                        playlistEl.setAttribute("disabled",false);
                        playV.value="";
                        downPlay = false;
                        playlistEl.style.background = "#404040";
                        playlistEl.innerText = "Fetch playlist";
                    })
                });
            });  
        } else {
            Tdata.map(list => {
                list.items.map(async item => {
                    return await Download(item.snippet.resourceId.videoId, path.resolve(videoFolder, convertToValidFilename(item.snippet.title) + ".mp4"),path.resolve(audioFolder, convertToValidFilename(item.snippet.title) + ".mp3"))
                })
                playlistEl.setAttribute("disabled",false);
                playV.value="";
                downPlay = false;
                playlistEl.style.background = "#404040";
                playlistEl.innerText = "Fetch playlist";
            })
        }
    }
})

playV.addEventListener("keyup", () => {
    if (playlistEl.style.background == "rgb(20, 171, 18)") {
        downPlay = false;
        document.getElementById("list").innerHTML = "";
        playlistEl.style.background = "#404040";
        playlistEl.innerText = "Fetch playlist";
    }
})



function convertToValidFilename(string) {
    return (string.replace(/[\/|\\:*?"<>]/g, " "));
}
function addLoader(durraw,name,edit){
    
    let loader = document.createElement("div");
    loader.className = "loader";
    edit.innerText = name;
    let bar=0;
    let stopId=setInterval(()=>{
        bar++;
        if(!(bar>=100)){
            loader.style.width=bar+"%";
        }
    },durraw) 
    edit.appendChild(loader);
    return ({stop:stopId,loader:loader,parent:edit});
}

function Download(id, output,audio) {
    return new Promise((resolve, rej) => {
        let downloaded=0;
        if (fs.existsSync(output)) {
            downloaded = fs.statSync(output).size;
        }
        let downloadedA=0;
        if (fs.existsSync(audio)) {
            downloadedA = fs.statSync(audio).size;
        }
        const down = document.getElementById("download");
        let containerL=document.createElement("div");
        containerL.className="loader-conatainer";
        down.appendChild(containerL);
        let loader;
        const audioY = youtubedl(`https://www.youtube.com/watch?v=${id}`,['--audio-format', 'mp3'],{start:downloadedA,cwd:__dirname});
        
        const video = youtubedl(`https://www.youtube.com/watch?v=${id}`,
            ['--format=18'],
            { start: downloaded, cwd: __dirname })
        video.on('info', function (info) {
            loader=addLoader(info._duration_raw,info._filename,containerL);
        })
        video.pipe(fs.createWriteStream(output, { flags: 'a'}))
        audioY.pipe(fs.createWriteStream(audio, { flags: 'a'}))
        video.on("error",(err)=>{
            containerL.remove();
            resolve(false);
        })
        audioY.on("complete",()=>{
            audioY.destroy()
        })
        audioY.on("error",()=>{
            audioY.destroy();
        })

        video.on('complete', function complete(info) {
            setInterval(loader.stopId);
                loader.loader.style.width="100%";
            setTimeout(()=>{
                loader.parent.remove();
            },100)
            resolve(info)
        })

        video.on('end', function () {
            if(loader){
                setInterval(loader.stopId);
                loader.loader.style.width="100%";
                setTimeout(()=>{
                    loader.parent.remove();
                },100)
            }
            resolve(true);
        })
    })
}
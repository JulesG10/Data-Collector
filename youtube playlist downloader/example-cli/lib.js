const path = require("path");
const youtubedl = require("youtube-dl");
const request = require("request");
const fs = require("fs");
const colors=require("colors");


module.exports = class {

    playlistID;
    option;
    KEY;
    TotalData = [];
    videoOut = __dirname;
    audioOut = __dirname;
    HaveFetch = false;
    Fails=0;
    SuccessCount=0;
    Count=0;
    Diff=0;
    SizeCount=0;

    constructor(option = {
        audio: false,
        video: false
    }, playlistID, output = {
        audio: __dirname,
        video: __dirname
    },key) {
        this.playlistID = playlistID;
        this.option = option;
        this.videoOut = output.video;
        this.audioOut = output.audio;
        this.KEY=key;
    }

    ValideFilename(string) {
        return (string.replace(/[\/|\\:*?"<>]/g, " "));
    }


    Download(id, output, audio=false) {
        return new Promise((resolve, reject) => {
            let downloader;
            let downloaded=0;
            if (fs.existsSync(output)) {
                downloaded = fs.statSync(output).size;
              }
            if (audio) {
                downloader = youtubedl(`https://www.youtube.com/watch?v=${id}`, ['--audio-format', 'mp3'], {
                    start: downloaded,
                    cwd: __dirname
                });
            } else {
                downloader = youtubedl(`https://www.youtube.com/watch?v=${id}`,
                    ['--format=18'], {
                        start: downloaded,
                        cwd: __dirname
                    })
            }
            let fileInfo;
            let This=this;
            downloader.on("info",(i)=>{
                fileInfo=i;
            })
            downloader.pipe(fs.createWriteStream(output, {
                flags: 'a'
            }))
            downloader.on("error", (err) => {
                This.Fails++;
                console.log(colors.bgRed("Fail")+" n°"+this.Fails+(fileInfo == undefined ? "" :" => "+fileInfo._filename.split('.').slice(0, -1).join('.')));
                resolve(this.Fails)
            })
            downloader.on('complete', function (info) {
                This.SuccessCount++;
                if(fileInfo){
                    This.SizeCount+=fileInfo.size;
                }
                console.log(colors.bgGreen("Success")+" n°"+This.SuccessCount+""+(fileInfo == undefined ? "" :" => "+fileInfo._filename.split('.').slice(0, -1).join('.') + " size: "+(Math.round(fileInfo.size/210))+"\/"+(Math.round(This.SizeCount/210))+"Ko"));
                resolve(this.SuccessCount)
            })
            
            downloader.on('end', function () {
                This.SuccessCount++;
                if(fileInfo){
                    This.SizeCount+=fileInfo.size;
                }
                console.log(colors.bgGreen("Success")+" n°"+This.SuccessCount+""+(fileInfo == undefined ? "" :" => "+fileInfo._filename.split('.').slice(0, -1).join('.') + " size: "+(Math.round(fileInfo.size/210))+"\/"+(Math.round(This.SizeCount/210))+"Ko"));
                resolve(this.SuccessCount);
            })
         })
    }

    DownloadAll() {
        if (this.HaveFetch) {
            let AudioCount=0;
            let VideoCount=0;
            console.log("\nVideoCount: "+this.Count+" VideoRequire:"+(this.Count+this.Diff)+" VideoNotFound:"+this.Diff);
            console.log(colors.bgWhite(colors.black("\n Start download \n")));
            if (this.option.audio) {
                this.TotalData.map(list => {
                    list.items.map(async item => {
                        AudioCount++;
                        let pathOut = path.resolve(this.audioOut, this.ValideFilename(item.snippet.title) + ".mp3");
                        console.log("Audio n°"+AudioCount+" start => "+item.snippet.title);
                        return await this.Download(item.snippet.resourceId.videoId, pathOut,true);
                    })
                })
            }
            if (this.option.video) {
                this.TotalData.map(list => {
                    list.items.map(async item => {
                        VideoCount++;
                        let pathOut = path.resolve(this.videoOut, this.ValideFilename(item.snippet.title) + ".mp4");
                        console.log("Video n°"+VideoCount+" start => "+item.snippet.title);
                        return await this.Download(item.snippet.resourceId.videoId, pathOut,false);
                    })
                })
            }
        }
    }

    FetchAll() {
        this.TotalData=[];
        this.HaveFetch = true;
        let data = [];
        console.log(colors.bgWhite(colors.black("\n Start fetch \n")));
        return new Promise((resolve, rej) => {
            request.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?key=${this.KEY}&playlistId=${this.playlistID}&maxResults=1000&part=contentDetails,id,snippet,status`, null, (err, res) => {
                let response = JSON.parse(res.body);
                if (JSON.parse(res.body).items == undefined) {
                    rej(JSON.parse(res.body))
                } else {
                    data.push(response);
                    this.Count=response.items.length;
                    this.Diff=response.pageInfo.totalResults-response.items.length;
                    this.TotalData = data;
                    let videoCount = response.items.length;
                    let pageToken = response.nextPageToken;
                    let This = this;
                    if(pageToken!=undefined){
                        (async function () {
                            while (videoCount < response.pageInfo.totalResults) {
                                await new Promise((success, error) => {
                                    request.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?key=${This.KEY}&playlistId=${This.playlistID}&maxResults=1000&part=contentDetails,id,snippet,status&pageToken=${pageToken}`, null, (err1, res1) => {  
                                    pageToken = JSON.parse(res1.body).nextPageToken || undefined;
                                        if(JSON.parse(res1.body).items==undefined){
                                            videoCount = response.pageInfo.totalResults + 1;
                                            success(videoCount);
                                        }else{
                                             if (pageToken == undefined) {
                                            videoCount+= JSON.parse(res1.body).items.length || JSON.parse(res1.body).pageInfo.resultsPerPage;
                                            This.Count=videoCount;
                                            This.Diff=response.pageInfo.totalResults-videoCount;
                                            videoCount = response.pageInfo.totalResults + 1;
                                            data.push(JSON.parse(res1.body));
                                            This.TotalData = data;
                                            resolve(data);
                                            success(videoCount);
                                            } else {
                                                videoCount += JSON.parse(res1.body).items.length || JSON.parse(res1.body).pageInfo.resultsPerPage;
                                                console.log("Add "+videoCount + " to "+videoCount+"\/"+ response.pageInfo.totalResults);
                                                data.push(JSON.parse(res1.body));
                                                success(pageToken);
                                            }
                                        }
                                    })
                                });
                            }
                        })();
                    }else{
                        resolve(data)
                    }
                }
            })
        })
    }

}

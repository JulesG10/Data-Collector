const video = require("youtube-dl");
const request = require("request");



module.exports = class Downloader {

    playlistID;
    option;
    KEY = "AIzaSyDjztJcvXS6HNSCeeMglRwBn8HlN9VQu8s";

    constructor(option = { audio: false, video: false }, playlistID) {
        this.playlistID = playlistID;
        this.option = option;
    }

    pop(desc, date, img) {
        const pop = document.getElementById("pop");
        pop.innerHTML = "";
        let match = desc.match(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig);
        let final = desc;
        if (match != null) {
            match.map(url => {
                final = final.replace(url, "<a href=\"" + url + "\" target=\"_BLANK\" class=\"link\">" + url + "</a>")
            })
        }
        pop.style.display = "block";
        let dateT = document.createElement("i");
        dateT.innerText = new Date(date).toLocaleDateString();
        let d = document.createElement("p");
        d.innerHTML = final;
        let logo = document.createElement("div");
        logo.style.backgroundImage = "url(\"" + img + "\")";

        pop.appendChild(logo)
        pop.appendChild(d)
        pop.appendChild(dateT)
        document.getElementById("pop").addEventListener("mouseleave", (e) => document.getElementById("pop").style.display = "none")
    }

    video() {
        let data = [];
        return new Promise((resolve, rej) => {
            request.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?key=${this.KEY}&playlistId=${this.playlistID}&maxResults=1000&part=contentDetails,id,snippet,status`, null, (err, res) => {
                let response = JSON.parse(res.body);
                if (JSON.parse(res.body).items == undefined) {
                    resolve(JSON.parse(res.body))
                } else {
                    JSON.parse(res.body).items.map(item => {
                        let div = document.createElement("div");
                        let logo = document.createElement("div");
                        logo.style.backgroundImage = "url(\"" + item.snippet.thumbnails.high.url + "\")";
                        div.addEventListener("mouseenter", (e) => {
                            if (document.getElementById("pop").style.display == "block") {
                                document.getElementById("pop").style.display = "none";
                            } 
                        })
                        logo.addEventListener("click", (e) => {
                            if (document.getElementById("pop").style.display == "block") {
                                document.getElementById("pop").style.display = "none";
                            } else {
                                this.pop(div.getAttribute("description"), div.getAttribute("videoDate"), item.snippet.thumbnails.high.url);
                            }
                        })

                        div.appendChild(logo);
                        div.id = item.snippet.resourceId.videoId;
                        let p = document.createElement("p")
                        p.innerText = item.snippet.title;
                        div.appendChild(p);
                        div.setAttribute("videoDate", item.snippet.publishedAt);
                        div.setAttribute("description", item.snippet.description)
                        list.appendChild(div);
                    })
                    data.push(response);
                    let videoCount = 0;
                    let pageToken = response.nextPageToken;
                    let K = this.KEY;
                    let id = this.playlistID;
                    (async function () {
                        while (videoCount < response.pageInfo.totalResults) {
                            await new Promise((success, error) => {

                                request.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?key=${K}&playlistId=${id}&maxResults=1000&part=contentDetails,id,snippet,status&pageToken=${pageToken}`, null, (err1, res1) => {
                                    pageToken = JSON.parse(res1.body).nextPageToken || undefined;
                                    if (pageToken == undefined) {
                                        videoCount = response.pageInfo.totalResults + 1;
                                        success(videoCount);
                                        resolve(data);
                                    } else {
                                        JSON.parse(res1.body).items.map(item => {
                                            let div = document.createElement("div");
                                            let logo = document.createElement("div");
                                            logo.addEventListener("click", () => {

                                            })
                                            logo.style.backgroundImage = "url(\"" + (item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : "") + "\")";
                                            div.appendChild(logo);
                                            div.id = item.snippet.resourceId.videoId;
                                            let p = document.createElement("p")
                                            p.innerText = item.snippet.title;
                                            div.appendChild(p);
                                            div.setAttribute("videoDate", item.snippet.publishedAt);
                                            div.setAttribute("description", item.snippet.description)
                                            list.appendChild(div);
                                        })
                                        videoCount += JSON.parse(res1.body).pageInfo.resultsPerPage;
                                        data.push(JSON.parse(res1.body));
                                        success(pageToken);
                                    }
                                })
                            });
                        }
                    })();
                }

            })
        })
    }
}
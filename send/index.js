const fs = require('fs');
const request = require('request');
const mime = require('mime-to-extensions');
const color = require('colors');
const loading =  require('loading-cli');
const path = require('path');

const load = loading("Send Request ...").start() 
let args = process.argv.splice(2,process.argv.length);
let method = "GET";
let url = "";
let makeFile = false;
let fileName = "";
if(args.length===0){
    load.stop();
    let l = `
    ░██████╗███████╗███╗░░██╗██████╗░
    ██╔════╝██╔════╝████╗░██║██╔══██╗
    ╚█████╗░█████╗░░██╔██╗██║██║░░██║
    ░╚═══██╗██╔══╝░░██║╚████║██║░░██║
    ██████╔╝███████╗██║░╚███║██████╔╝
    ╚═════╝░╚══════╝╚═╝░░╚══╝╚═════╝░
    `;
    console.log(l+"\n");
    console.log("send <url> <method (GET|POST|DELETE|PUT)> [-file=<filename>] ");
}else{
    
args.map(arg=>{
    // if(arg.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)){
    if(arg.startsWith("http://") || arg.startsWith("https://")){
        url = arg;
    }else if(arg.match(/(GET|POST|PUT|DELETE)/)){
        method = arg;
    }else if(arg.match(/\-(file)\s*\=\s*[a-zA-Z0-9]+/)){
        makeFile=true;
        fileName=arg.replace(/\-(file)\s*\=/,'').trim();
    }
})

function req(methodR,uri){
    return new Promise((res,rej)=>{
        load.text="Sending request ...";
        request(uri,{
            method:methodR
        },(err,reqR,response)=>{
            load.text = "Waiting for response ...";
            if(err){
                rej(err);
            } 
            res([reqR,response]);
        })
    });
}

if(url.length!==0){
    req(method,url).then(data=>{
        load.text = "Response [OK] !";
        let extension = "txt";
        for (let i = 0; i < data[0].rawHeaders.length; i++) {
            if(data[0].rawHeaders[i] === "Content-Type"){
                extension=mime.extension(data[0].rawHeaders[i+1]);
            }
        }
        if(makeFile&&fileName.length!==0){
            load.stop()
            fs.appendFile(fileName+"."+extension,data[1],(err)=>{});
            console.log(color.bgGreen(color.black("\n Success "))," to create file ["+fileName+"."+extension + "] at "+" \""+__dirname+"\\"+fileName+"."+extension+"\" !\n");
            if(data[0].statusCode!==200){
                console.log(color.bgYellow(color.black(" WARM "))," Server response with status ["+data[0].statusCode+"]");
            }
        }else{
            load.stop();
            console.log(color.green(data[1]));
            console.log(color.bgGreen(color.black("\n Success "))," to send request to \""+url+"\" !\n");
            if(data[0].statusCode!==200){
                console.log(color.bgYellow(color.black(" WARM "))," Server response with status ["+data[0].statusCode+"]");
            }
        }
    }).catch(err=>{
        load.stop();
        console.log(color.bgRed(color.black("\n ERROR "))," Fail to send request to \""+url+"\" !");
    })
}else{
    load.stop();
    console.log(color.bgRed(color.black("\n ERROR "))," Fail to send request there is no url !");
}
}

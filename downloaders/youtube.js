import axios from "axios";


export default async function youtube(videoUrl) {
    const headers = {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en-US,en;q=0.8',
        'Content-Length': '53',
        'Content-Type': 'application/json',
        'Origin': 'https://cobalt.tools',
        'Priority': 'u=1, i',
        'Referer': 'https://cobalt.tools/',
        'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Brave";v="126"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Gpc': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
    };
    
    try {
                
        const response = await axios.post(process.env.ytUrl,  {url: videoUrl},{headers} );
        return { url:response.data.url};
   } catch (error) {
      console.log(error.message,error)   ;
      return error;
    }
}
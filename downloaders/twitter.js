import axios from 'axios';




export default async function twitter(tweetUrl) {
    let url = tweetUrl.replace(/twitter\.com|x\.com/g, process.env.x_url);
    console.log('replacedUrl:', url)


    try {
        let result = await axios.get(url).then((res) => res.data).catch((err) => {
            return { found: false, error: 'An issue occured. Make sure the twitter link is valid.' }
        })
        console.log(result);
        return { result }
    } catch (error) {
        console.log(error.message, error);
        return error;
    }
}




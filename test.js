import s from "./app.js";
import 'dotenv/config'


async function test(params) {
    try {
        
        
        // console.log(await s.facebook('https://www.facebook.com/watch?v=1375506373158765'));

        console.log(await s.instagram('https://www.instagram.com/stories/developer_rahul_/'));

        // console.log(await s.twitter('https://x.com/whyrohitwhy/status/1856378155092803962'));
        
        // console.log(await s.youtube('https://www.youtube.com/watch?v=IWEehKcIZ4s')); NOt available
    } catch (error) {
     console.log(error,'errr in test');
        
    }

}
test()
import 'dotenv/config'

import facebook from "./downloaders/facebook.js";
import instagram from "./downloaders/instagram.js";
import twitter from "./downloaders/twitter.js";

const s = { twitter,instagram,facebook }
export default s;
 
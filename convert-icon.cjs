const { Jimp } = require('jimp');
const pngToIco = require('png-to-ico');
const fs = require('fs');

(async () => {
  try {
    const origPath = 'C:\\Users\\tom12\\.gemini\\antigravity\\brain\\a6db5600-4634-4b99-acec-a1f0ae7a009e\\media__1775547341006.jpg';
    console.log("Reading image...");
    const image = await Jimp.read(origPath);
    console.log("Resizing...");
    image.resize({ w: 256, h: 256 });
    console.log("Writing temp png...");
    await image.write('icon_temp.png');
    
    console.log("Converting to ico...");
    const buf = await pngToIco('icon_temp.png');
    fs.writeFileSync('icon.ico', buf);
    
    console.log("Done!");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();

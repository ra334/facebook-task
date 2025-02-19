import puppeteer from "puppeteer"
import fs from "fs"
import winston from "winston"

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: 'out.log',
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple()
      ),
    }),
  ],
})

const email = ''
const password = ''
let facebookPic;

async function parseFacebook(email, password) {
    const browser = await puppeteer.launch({
        headless: false, 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    })
    const page = await browser.newPage()
    logger.info('Navigating to Facebook login page...')
    await page.goto("https://facebook.com/login", { waitUntil: 'load' })

    await page.type('input[name="email"]', email)
    await page.type('input[name="pass"]', password)
    await page.click('button[type="submit"]')

    logger.info('Login form submitted. Waiting for navigation...')
    await page.waitForNavigation({ waitUntil: 'load' })

    await page.goto("https://facebook.com/me", { waitUntil: 'load' })
    logger.info('Navigated to the profile page.')

    const profilePic = await page.evaluate(() => {
        const images = document.getElementsByTagName("image")
        return images[2]?.href?.baseVal || null
    })

    await browser.close()

    if (profilePic) {
        logger.info('Facebook profile picture retrieved successfully.')
    } else {
        logger.warn('Profile picture not found.')
    }

    return profilePic
}

try {
    facebookPic = await parseFacebook(email, password) || null
    console.log('Facebook Profile Picture:', facebookPic)
    fs.writeFileSync('picture.txt', facebookPic)
    logger.info('Script execution completed.')
} catch (error) {
    logger.error('Script failed:', error)
    fs.writeFileSync('error.log', `Error: ${error.message}\nStack: ${error.stack}`)
}

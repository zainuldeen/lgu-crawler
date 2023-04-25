import { intro, outro, spinner } from '@clack/prompts';
import { delay, replaceAll, sleep } from './lib/util';
import { scrapeMetaData } from './scrapper/meta_data';
import dotenv from 'dotenv';
dotenv.config();

import { write_metadata, writeTimetableData } from './lib/firebase';
import { scrapTimetable } from './scrapper/timetable';
import { getHomePage } from './lib/home_page';


/// INTRO

intro("Welcome to LGU Timetable Crawler 🤖");

const s = spinner();

const intro_cli = async()=>{
    s.start("preparing for MetaData fetching | key = " + process.env.SESSION_ID);
    await delay(2)
    s.stop("All set! Going to fetch MetaData");
};

(async()=>{
    await intro_cli();
    const metaData = await scrapeMetaData();

    s.start("Writing MetaData to firebase");
    await write_metadata(metaData);
    s.start("MetaData has been added to firebase store");
    
    
    for await (let [semester, data] of Object.entries(metaData)) {
        for await (let [program, sections] of Object.entries(data as any)) {
            for await (let section of sections as Array<string>) {
                const payload = {
                    semester: semester.trim(),
                    program: program.trim(),
                    section: section.trim()
                  };

                s.start(`Scraping Timetable with Payload = ${payload}`);
                
                try {
                    const [browser, page] = await getHomePage();
                    const userAgent =
                        'Mozilla/5.0 (X11; Linux x86_64)' +
                        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.39 Safari/537.36';
                    await page.setUserAgent(userAgent);

                    await page.waitForNetworkIdle();

                    sleep(1000);

                    const res = await scrapTimetable(payload, page);
                    

                    s.stop("Scraped Successfully | payload = " + payload);
                    
                    // write data to firebase
                    s.start(`Writing Timetable Data to FireStore | Payload = ${payload}`);
                    writeTimetableData(res, 
                        replaceAll (
                            `${payload.semester} ${payload.program} ${payload.section}`,
                            `/`,
                            '-'
                        )
                    );
                    s.start(`Write Operation to FireStore Succeed | DocId = '${payload.semester} ${payload.program} ${payload.section}'`);
                    browser.close();
                } catch (err) {
                    s.stop(`fail with an error: ${err}`);
                }
            }
        }
    }

    outro("Happy Coding ♥");
})();

// Promise.all([cli_intro()])

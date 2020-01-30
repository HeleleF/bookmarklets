(async () => {

    const sleep = waitInSec => new Promise(resolve => setTimeout(resolve, waitInSec * 1000));

    const safeApiCall = (promiseLike) => {
        return promiseLike
            .then(r => r.json())
            .then(r => {

                    if (r.data.status === 'error') {
                        const msg = r.data.tasks.filter(t => t.status === "error").reduce((acc, cur) => acc += cur.message + '\n', '');
                        log(msg, 0);
                        return null;
                    }
                    return r.data;
                
            })
            .catch(e => {
                log(e.message, 0);
                return null;
            });
    };

    if (document.getElementById('__overlay')) return;

    const c = document.createElement('div');
    c.id = '__overlay';
    c.style.cssText = 'position: fixed;display: block;width: 100%;height: 100%;top: 0;left: 0;right: 0;bottom: 0;background-color: rgba(0,0,0,0.95);z-index: 999999;cursor: pointer;';

    const i = document.createElement('div');
    i.style.cssText = 'position: absolute;top: 50%;left: 50%;font-size: 20px;color: white;transform: translate(-50%,-50%);';
    c.appendChild(i);
    document.body.appendChild(c);

    const log = (msg, level = 1) => {
        const node = document.createElement('span');
        switch (level) {
            case 0:
                node.style.color = 'red';
                node.textContent = '[ERROR] '
                break;
            case 2:
                node.style.color = 'green';
                node.textContent = '[SUCCESS] '
                break;
            case 1:
            default:
                node.style.color = 'white';
                node.textContent = '[INFO] '
                break;
        }
        node.textContent += msg.trim();
        i.appendChild(node);
        i.appendChild(document.createElement('br'));
    };

    const wrap = document.querySelector(".viewerInner");
    if (!wrap) {
        log('No viewer found', 0);
        return;
    }

    const pageCount = wrap.querySelectorAll('.page').length;
    if (!pageCount) {
        log('No pages found', 0);
        return;
    }

    if (pageCount > 5) {
        log(`More than 5 pages is not supported (yet)`, 0);
        return;
    }

    // in most cases svg, sometimes png
    const [, ext] = document.querySelector("#score_0").src.match(/\/score_0\.(\w+)\?/);

    if (!ext) {
        log('No extension found', 0);
        return;
    }

    const title = document.querySelector('meta[property="og:title"]').content;
    const uri = document.querySelector('meta[property="og:image"]').content.split("/").slice(0, -1).join("/");

    log(`Found ${pageCount} page${pageCount > 1 ? 's': ''} for ${title}`, 1);

    const TOK = `eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6IjUxMTM5YTIwZmZkZmU3MmNjMDRlOTdjNTdkNmZkNWQwNDg3MzA4NTI4NGM4YTA1ODhmMzZmOGU2ZGJkMmU0MDI4ZmM0YTdjYTJiYWIzMTliIn0.eyJhdWQiOiIxIiwianRpIjoiNTExMzlhMjBmZmRmZTcyY2MwNGU5N2M1N2Q2ZmQ1ZDA0ODczMDg1Mjg0YzhhMDU4OGYzNmY4ZTZkYmQyZTQwMjhmYzRhN2NhMmJhYjMxOWIiLCJpYXQiOjE1ODAzMzM1MDUsIm5iZiI6MTU4MDMzMzUwNSwiZXhwIjo0NzM2MDA3MTA1LCJzdWIiOiIzMTY1Mzc3NyIsInNjb3BlcyI6WyJ0YXNrLnJlYWQiLCJ0YXNrLndyaXRlIl19.UwyvEUBCR0T8jp2Wx9tWJWs3FntMUTHT5dtLNLX0bDACCx_4UaFo3nTBycgPsdcmO4_Z9Tgdbo2VNAmB3BIQ2ilYxeJxdAMO4v72BMYScT0X4DykjOqpReVY13-8ASO2H5fchETrnyRZfTLxh21AT0QhAB23RIAAvfgw3G4UxZgSoBtS_YF0VkK9UjFo1o8hVYby4fznlCC6q1b487vDJxrzBcuBQlZtqVL_ELhsKM3SZODerjKeOE3t4WPO3DLGFMdQUl8xtDSZGtxy8iQThz1Y1h5II6vuGGfLdu6geQ_MT8aqxEpan1RNCFLr1WQweranKdTt5tsDohIVsLndaobLMxGZ1i5kCRQX3DKp8SszdEGx510NrzkvKnNEl-PLXW0LCm1ZvcHERkE-nK65-nxbF38LAD2WJbyH1uZLdM-V5E-I13wbfR93Xc0T2ij-eYwjtGsbPlP8TawU2FZoC8aTmFSaH1miAoRFuVsmYOPO13GplMwRj6jG5IubwR1Qxq4JXOhLLojcRSwIjXEpSKPNV8gh4A95wBLNrIrwCMNhec1rSy_p_qLTGDGfi2mJaGsn0gMqzH6rOqg-hueMZCEH35mOA02vqgwJZIY3AVwbwkC73PzZG9JViA3u1SSFCgERHHupfOSSf7oSYPm7f8oXtsUORCH2GMdiJ4eAALg`;

    const payload = {
        tasks: {
            mergeSheet: {
                operation: "merge",
                input: [],
                filename: `${title} Sheet.pdf`,
                output_format: "pdf",
            },
            exportSheet: {
                operation: "export/url",
                input: ["mergeSheet"],
                inline: false,
                archive_multiple_files: false
            }
        }
    };

    for (let i = 0; i < pageCount; i++) {
        payload.tasks[`importSheet${i}`] = {
            operation: "import/url",
            url: `${uri}/score_${i}.${ext}`,
            filename: `${title}(${i}).${ext}`,
        };
        payload.tasks.mergeSheet.input.push(`importSheet${i}`);
    }

    log(`Starting job...`, 1);

    const job = await safeApiCall(fetch(`https://api.cloudconvert.com/v2/jobs`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            Authorization: `Bearer ${TOK}`,
            'Content-type': 'application/json',
        },
    }));

    if (!job) return;

    log(`Started job with id ${job.id}`, 2);
    log(`Waiting...`, 1);

    let down = 5 + pageCount;

    const timer = setInterval(() => {

        if (down-- > 0) {
            log(`Wait ${down}...`, 1);
        } else {
            clearInterval(timer);
        }     
    }, 1000);

    await sleep(5 + pageCount);

    const result = await safeApiCall(fetch(`https://cors-anywhere.herokuapp.com/https://api.cloudconvert.com/v2/jobs/${job.id}/wait`, {
        headers: {
            Authorization: `Bearer ${TOK}`,
        }
    }));

    if (!result) return;

    log(`Recieved data`, 1);

    const exportTask = result.tasks.filter(t => t.operation === 'export/url' && t.status === 'finished')[0];

    if (!exportTask) {
        log(`No exported data found!`, 0);
        return;
    }

    try {
        location.href = exportTask.result.files[0].url;
        log(`Finished! Click anywhere to close!`, 2);
    } catch (_) {
        log(`No download link found`, 0);
    }
    c.onclick = (ev) => {
        c.remove();
    };
})();

(() => {
    const script = document.createElement('script');
    script.src = ``;
    document.head.appendChild(script);
})();




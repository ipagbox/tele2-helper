// ==UserScript==
// @name         TELE2 Market Helper
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Automatic seller for minutes and gigabytes
// @author       Igor Prudnikov
// @homepage     http://github.com/ip-agbox/tele2-helper
// @match        https://*.tele2.ru/stock-exchange/my
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const TYPE_GIGABYTES = 0;
    const TYPE_MINUTES = 1;
    const TYPE_SMS = 2;
    const TITLE_WARN = true; // show current step it tab title
    const CONSOLE_WARN = true; // show current step it tab title
    const REFRESH_TIMER = 1500; // timer for the next try if selector not found
    const BASE_DELAY = 2000; // minimum delay between steps
    const RANDOM_DELAY = 100; // additional random delay between steps to apeear more human
    const PAGE_RELOAD_DELAY = 5000; // delay for page reload when all steps are done
    const PAGE_RELOAD_IF_FAIL = 60000;
    const FIRST_RUN_MARKER = 'FIRST_RUN';
    let price = Array();
    let volume = Array();
    price[TYPE_GIGABYTES] = 30;
    price[TYPE_MINUTES] = 40;
    price[TYPE_SMS] = 50;
    volume[TYPE_GIGABYTES] = 2;
    volume[TYPE_MINUTES] = 50;
    volume[TYPE_SMS] = 50;

    const LOT_TYPE = TYPE_GIGABYTES; /* CHOOSE TYPE YOU NEED */

    let task_queue = [{ selector: '.my-active-lots__list .my-lot-item:last-child a', title: 'Edit last lot', fallback: true },
                        { selector: '.btns-box a:nth-child(2)', title: 'Cancel lot' },
                        { selector: '.btns-box a.btn', title: 'Confirm cancel' },
                        { custom_func: wait_cancel_complete, selector: '.info-modal,.violet-style', title: 'Wait cancel complete' },
                        { selector: '.btn-black', title: 'Create new lot', fallback: true },
                        { selector: `#rw_1_listbox li:nth-child(${LOT_TYPE + 1}) label`, title: 'Choose lot type' },
                        { selector: '.btns-box a:first-child', title: 'Apply lot type' },
                        { selector: '.lot-setup__manual-input a', title: 'Press cost manual input' },
                        { custom_func: input_qty_value, selector: 'input[name=lotVolume]', title: 'Input cost value' },
                        { custom_func: emulate_input_event, selector: 'input[name=lotVolume]', title: 'Emulate input' },
                        { selector: '.lot-setup__cost-field-container .lot-setup__manual-input a', title: 'Press volume manual input' },
                        { custom_func: input_cost_value, selector: 'input[name=lotCost]', title: 'Input cost value' },
                        { custom_func: emulate_input_event, selector: 'input[name=lotCost]', title: 'Emulate input' },
                        { selector: '.btns-box a.btn', title: 'Confirm input' },
                        { selector: '#showSellerName', title: 'Disable name visibility' },
                        { selector: '.btns-box a.btn', title: 'Finish creation' },
                        { custom_func: reload_page, selector: 'html', title: 'Reload page'}];

    init();

    function init() {
        if (localStorage.getItem("betCount") === null) {
            localStorage.betCount = JSON.stringify(0);
        }
        setTimeout(() => location.reload(), PAGE_RELOAD_IF_FAIL);
        queue_step({ selector: FIRST_RUN_MARKER, title: 'Init job' });
    }

    function queue_step(itemObj) {
        if(document.querySelector(itemObj.selector) == null && itemObj.selector != FIRST_RUN_MARKER) {
            log_info(`${itemObj.title}: Waiting for selector`);
            setTimeout(() => queue_step(itemObj), REFRESH_TIMER);
        } else {
            log_info(itemObj.title);
            // check fallback
            // check custom func
            if('custom_func' in itemObj) {
                log_info('===custom func===');
                itemObj.custom_func(itemObj.selector);
            } else {
                setTimeout(() => queue_step(task_queue.shift()), delay());
                if(itemObj.selector != FIRST_RUN_MARKER) {
                    document.querySelector(itemObj.selector).click();
                }
            }
        }
    }

    function delay() {
        return Math.round(Math.random() * RANDOM_DELAY + BASE_DELAY);
    }

    function log_info(message) {
        if (TITLE_WARN) {
            document.title = message;
        }
        if (CONSOLE_WARN) {
            console.warn(message);
        }
    }

    function input_cost_value(selector) {
        log_info('Func started: input cost value');
        if(document.querySelector(selector) == null) {
            setTimeout(() => input_cost_value(selector), REFRESH_TIMER);
        } else {
            document.querySelector(selector).value = price[LOT_TYPE];
            setTimeout(() => queue_step(task_queue.shift()), delay());
        }
    }

    function input_qty_value(selector) {
        log_info('Func started: input volume value');
        if(document.querySelector(selector) == null) {
            setTimeout(() => input_cost_value(selector), REFRESH_TIMER);
        } else {
            document.querySelector(selector).value = volume[LOT_TYPE];
            setTimeout(() => queue_step(task_queue.shift()), delay());
        }
    }

    function emulate_input_event(selector) {
        log_info('Func started: emulate input event');
        if(document.querySelector(selector) == null) {
            setTimeout(() => emulate_input_event(selector), REFRESH_TIMER);
        } else {
           document.querySelector(selector).dispatchEvent(new Event("input", {"bubbles":true, "cancelable":false}));
           setTimeout(() => queue_step(task_queue.shift()), delay());
        }
    }

    function wait_cancel_complete(selector) {
        log_info('Func started: wait cancel complete');
        if(document.querySelector(selector) != null) {
            setTimeout(() => wait_cancel_complete(selector), REFRESH_TIMER); // DELAY REFRESH TODO
        } else {
           setTimeout(() => queue_step(task_queue.shift()), delay());
        }
    }

    function reload_page(selector) {
        log_info('Reload page');
        console.warn('Bets counter: ' + localStorage.betCount);
        localStorage.betCount = JSON.stringify(JSON.parse(localStorage.betCount) + 1);

        setTimeout(() => location.reload(), PAGE_RELOAD_DELAY);
    }
})();

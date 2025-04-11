// ==UserScript==
// @name         Notifiche Server Down
// @namespace    https://muninn.ovh
// @version      2.4
// @description  Notifica popup e suono per ticket Server Offline con status New
// @author       Leproide
// @include      https://ww19.autotask.net/Mvc/ServiceDesk/TicketGridWidgetDrilldown.mvc/PrimaryStandardDrilldown?ContentId=CHANGEME*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autotask.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configurazioni
    const NotificaContinua = false;
    const SoundAttivato = true;
    const PopupAttivato = true;
    const soundURL = "https://changeme.ovh/Autotask/ServerOfflineParlato.mp3";
    const trackerKey = "serverTicketTracker";
    const modeKey = "serverTicketTrackerMode";

    // Inizializzazione storage
    if (localStorage.getItem(modeKey) !== String(NotificaContinua)) {
        localStorage.removeItem(trackerKey);
        localStorage.setItem(modeKey, String(NotificaContinua));
    }

    // Funzioni di gestione storage
    const loadTracker = () => JSON.parse(localStorage.getItem(trackerKey)) || {};
    const saveTracker = tracker => localStorage.setItem(trackerKey, JSON.stringify(tracker));

    // Notifica desktop
    function showOSNotification(company) {
        if (Notification.permission === "granted") {
            new Notification("SERVER OFFLINE", {
                body: `SERVER OFFLINE! ${company}`,
                icon: 'https://changeme.ovh/Autotask/alert-icon.png'
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("SERVER OFFLINE", {
                        body: `SERVER OFFLINE! ${company}`,
                        icon: 'https://changeme.ovh/Autotask/alert-icon.png'
                    });
                }
            });
        }
    }

    // Riproduzione audio
    function playAudio() {
        return new Promise((resolve, reject) => {
            if (!SoundAttivato) return resolve();

            const audio = new Audio(soundURL);
            audio.preload = "auto";

            audio.addEventListener('ended', () => resolve());
            audio.addEventListener('error', (err) => reject(err));

            audio.play().catch(err => {
                console.error("Errore riproduzione audio:", err);
                reject(err);
            });
        });
    }

    // Notifica combinata
    async function showNotification(company) {
        try {
            const promises = [];
            if (PopupAttivato) promises.push(showOSNotification(company));
            if (SoundAttivato) promises.push(playAudio());
            await Promise.allSettled(promises);
        } catch (err) {
            console.error("Errore nella notifica:", err);
        }
    }

    // Estrazione dati ticket
    function processRow(row) {
        const cells = row.querySelectorAll("td");
        let ticketNumber = "";
        let status = "";
        let title = "";
        let company = "";

        cells.forEach(cell => {
            const cellText = cell.textContent.trim();

            if (!ticketNumber && /^T\d+\.\d+$/.test(cellText)) {
                ticketNumber = cellText;
            }

            if (!title && cellText.toLowerCase().includes("server offline")) {
                title = cellText;
            }

            if (!status && cellText === "New") {
                status = cellText;
            }

            if (!company && cellText && cellText !== ticketNumber &&
                cellText !== status && !cellText.toLowerCase().includes("server offline")) {
                company = cellText;
            }
        });

        return { ticketNumber, status, title, company };
    }

    // Controllo ticket
    function checkTickets() {
        const tracker = loadTracker();
        const rows = document.querySelectorAll("table tbody tr.Display");

        rows.forEach(row => {
            const { ticketNumber, status, title, company } = processRow(row);

            if (title && status === "New") {
                if (NotificaContinua || !tracker[ticketNumber]) {
                    showNotification(company);
                    tracker[ticketNumber] = true;
                }
            }
        });

        saveTracker(tracker);
    }

    // Ciclo unico con reload
    function main() {
        checkTickets();
        setTimeout(() => location.reload(), 60000); // Solo reload ogni 60s
    }

    // Avvio
    main();
})();
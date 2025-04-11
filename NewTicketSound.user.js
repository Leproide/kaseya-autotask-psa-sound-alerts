// ==UserScript==
// @name         Notifica Nuovi Ticket Autotask
// @namespace    https://muninn.ovh
// @version      1.13
// @description  Notifica con suono e popup quando compare un nuovo ticket o cambia stato su Autotask, con audio differenziati e variabili di configurazione.
// @author       Leproide
// @include      https://ww19.autotask.net/Mvc/ServiceDesk/TicketGridWidgetDrilldown.mvc/PrimaryStandardDrilldown?ContentId=CHANGEME*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=autotask.net
// @grant        none
// ==/UserScript==

// Per visualizzare il contenuto del local storage lanciare in console:
// localStorage.getItem('ticketTracker');
// E per resettarlo:
// localStorage.removeItem('ticketTracker');

(function() {
    'use strict';

    // --- Variabili di configurazione ---
    const ENABLE_SOUND = true;
    const ENABLE_POPUP_NOTIFICATION = true;
    const NotificaNew = true;
    const NotificaQualificati = true; // Imposta a false se non vuoi notifiche per qualificati
    const NotificaRapidi = true; // Imposta a true se vuoi notificare i rapidi

    const defcon1or2SoundUrl = 'https://changeme.ovh/Autotask/DEFCON1-2.wav';
    const rapidoSoundUrl = 'https://changeme.ovh/Autotask/RAPIDO.mp3';
    const defaultSoundUrl = 'https://changeme.ovh/Autotask/NuovoTicketParlato.mp3';

    // --- Funzione per richiedere il permesso per le notifiche ---
    function requestNotificationPermission() {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission().then(function(permission) {
                console.log("Permission per notifiche:", permission);
            });
        }
    }

    // --- Funzione per suonare il file audio ---
    function playSound(url) {
        if (!ENABLE_SOUND) return;
        const audio = new Audio(url);
        audio.play().catch(err => console.error("Impossibile riprodurre il suono:", err));
    }

    // --- Funzione per mostrare la notifica popup ---
    function showNotification(message) {
        if (!ENABLE_POPUP_NOTIFICATION) return;
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification(message);
        } else {
            console.error("Permesso notifiche non concesso o non supportato");
        }
    }

    // --- Funzione per caricare lo storage dei ticket ---
    function loadTicketTracker() {
        return JSON.parse(localStorage.getItem("ticketTracker") || "{}");
    }

    // --- Funzione per salvare lo storage dei ticket ---
    function saveTicketTracker(tracker) {
        localStorage.setItem("ticketTracker", JSON.stringify(tracker));
    }

    // --- Funzione per scansionare la griglia dei ticket ---
    function scanTickets() {
        const rows = document.querySelectorAll("table tbody tr.Display");
        const currentTickets = {};
        const newOrUpdatedTickets = [];

        let storedTracker = loadTicketTracker();

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");
            let ticketNumber = "";
            let status = "";
            let defcon = "";
            let isRapido = false; // Variabile per tenere traccia se il ticket è rapido

            // Scansiona le celle per identificare i valori di ticketNumber, status e defcon
            cells.forEach(cell => {
                const cellText = cell.textContent.trim();

                // Ticket number (inizia con "T" seguito da numeri)
                if (cellText.startsWith("T") && /\d+\.\d+/.test(cellText)) {
                    ticketNumber = cellText;
                }

                // Status: "QUALIFICATO" o "New"
                if (cellText === "QUALIFICATO" || cellText === "New") {
                    status = cellText;
                }

                // Priorità: "RAPIDO" o "DEFCON X"
                if (cellText === "RAPIDO" || /^DEFCON \d+$/.test(cellText)) {
                    defcon = cellText;
                    if (cellText === "RAPIDO") {
                        isRapido = true; // Se il ticket è "RAPIDO", imposta isRapido a true
                    }
                }
            });

            // Se il ticket è RAPIDO, consideralo solo come RAPIDO
            if (ticketNumber && (status === "QUALIFICATO" || status === "New")) {
                if (isRapido) {
                    status = "RAPIDO"; // Override dello status a RAPIDO
                }

                currentTickets[ticketNumber] = status + "|" + defcon;
                if (!storedTracker[ticketNumber]) {
                    newOrUpdatedTickets.push({ ticketNumber, status, defcon });
                    storedTracker[ticketNumber] = { status, defcon, timestamp: Date.now() };
                } else if (storedTracker[ticketNumber].status !== status || storedTracker[ticketNumber].defcon !== defcon) {
                    newOrUpdatedTickets.push({ ticketNumber, status, defcon });
                    storedTracker[ticketNumber].status = status;
                    storedTracker[ticketNumber].defcon = defcon;
                    storedTracker[ticketNumber].timestamp = Date.now();
                }
            }
        });

        for (let key in storedTracker) {
            if (!currentTickets[key]) {
                delete storedTracker[key];
            }
        }
        saveTicketTracker(storedTracker);

        // Funzione per riprodurre i suoni uno dopo l'altro con un delay di 2 secondi
function playSoundsInSequence(sounds) {
    let index = 0;
    const playNext = () => {
        if (index < sounds.length) {
            const audio = new Audio(sounds[index]);

            // Rimuovi il pre-caricamento e gestisci direttamente la riproduzione
            audio.play().then(() => {
                index++;
                if(index < sounds.length) {
                    // Aspetta che il suono corrente finisca prima di far partire il prossimo
                    audio.addEventListener('ended', () => {
                        setTimeout(playNext, 3000); // Piccolo delay dopo la fine
                    });
                }
            }).catch(err => console.error("Errore:", err));
        }
    };
    playNext();
}

        // Invia le notifiche per i ticket nuovi o con stato aggiornato
        newOrUpdatedTickets.forEach(ticket => {
            let soundsToPlay = []; // Array per memorizzare i suoni da riprodurre

            if (ticket.status === "New") {
                if (NotificaNew) {
                    showNotification("Nuovo ticket ricevuto");
                    soundsToPlay.push(defaultSoundUrl);
                    console.log("Notifica inviata per ticket", ticket.ticketNumber, "con status New");
                }
            } else if (ticket.status === "RAPIDO") {
                if (NotificaRapidi) {
                    const message = "Nuovo ticket RAPIDO qualificato";
                    showNotification(message);

                    // Aggiungi il suono "RAPIDO" solo una volta
                    if (!soundsToPlay.includes(rapidoSoundUrl)) {
                        soundsToPlay.push(rapidoSoundUrl);
                    }

                    console.log("Notifica inviata per ticket", ticket.ticketNumber, "con status RAPIDO");
                }
            } else if (ticket.status === "QUALIFICATO") {
                if (NotificaQualificati) {
                    const message = "Nuovo ticket qualificato";
                    showNotification(message);
                    const defconUpper = ticket.defcon.toUpperCase();
                    if (defconUpper === "DEFCON 1" || defconUpper === "DEFCON 2") {
                        soundsToPlay.push(defcon1or2SoundUrl);
                    } else {
                        soundsToPlay.push(defaultSoundUrl);
                    }
                    console.log("Notifica inviata per ticket", ticket.ticketNumber, "con status QUALIFICATO");
                }
            }

            // Riproduce i suoni in sequenza con delay di 2 secondi
            if (soundsToPlay.length > 0) {
                playSoundsInSequence(soundsToPlay);
            }
        });
    }

    // --- Funzione per aggiornare la pagina ---
    function refreshPage() {
        // localStorage.removeItem('ticketTracker'); // Suono continuo
        location.reload();
    }

    // --- Inizializzazione ---
    requestNotificationPermission();
    scanTickets();

    setInterval(() => {
        scanTickets();
        refreshPage();
    }, 10000);

})();

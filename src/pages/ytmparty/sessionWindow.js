const { ipcRenderer, clipboard } = require('electron')
const settingsProvider = require('../../providers/settingsProvider')

const btnCreateSess = document.getElementById('ytmp-host-session-btn')
const btnJoinSess = document.getElementById('ytmp-join-session-btn')
const btnEndSess = document.getElementById('ytmp-end-session-btn')

const hostSessCode = document.getElementById('ytmp-host-session-code')
const endSessCode = document.getElementById('ytmp-end-session-code')

const hostCopySessCode = document.getElementById('ytmp-host-session-copycode')
const endCopySessCode = document.getElementById('ytmp-end-session-copycode')

const joinCodeinput = document.getElementById('ytmp-session-code-input')

document.addEventListener('DOMContentLoaded', () => {
    joinCodeinput.addEventListener('change', (e) => {
        //@TODO esto no funsiona
        if (e.value != '') {
            btnJoinSess.removeAttribute('disabled')
        } else {
            btnJoinSess.addAttribute('disabled')
        }
    })
    btnCreateSess.addEventListener('click', () => {
        ytmpCreateSess()
    })
    btnJoinSess.addEventListener('click', () => {
        if (joinCodeinput.nodeValue != '') {
            ytmpJoinSess(joinCodeinput.nodeValue)
            document
                .getElementById('ytmp-join-helper-text')
                .setAttribute('data-error', '')
        } else {
            document
                .getElementById('ytmp-join-helper-text')
                .setAttribute('data-error', "Can't be empty!")
        }
    })
    btnEndSess.addEventListener('click', () => {
        ytmpEndSess()
    })

    hostCopySessCode.addEventListener('click', () => {
        clipboard.writeText(hostSessCode)
    })
    endCopySessCode.addEventListener('click', () => {
        clipboard.writeText(endSessCode)
    })

    //Suscribirse a los eventos del back de socketio

    function ytmpCreateSess() {
        //socketio emit
    }

    function ytmpJoinSess(sessionId) {
        //socketio emit
    }

    function ytmpEndSess() {
        //socketio emit
    }
})

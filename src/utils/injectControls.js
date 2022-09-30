const { ipcRenderer } = require('electron')

// FIXME: This should not be sync IPC
const translate = (id, params) =>
    ipcRenderer.sendSync('I18N_TRANSLATE', id, params)

// FIXME: This should not be sync IPC
const settingsGet = (key) => ipcRenderer.sendSync('SETTINGS_GET', key)

const settingsOnDidChange = (key, cb) => {
    ipcRenderer.on(`SETTINGS_NOTIFY_${key}`, (e, newValue, oldValue) =>
        cb({ newValue, oldValue })
    )
    ipcRenderer.send('SETTINGS_SUBSCRIBE', key)
}

const isWindows = () => {
    return process.platform === 'win32'
}

window.addEventListener('load', () => {
    createContextMenu()
    createPlayerColorRules()

    const { hostname } = window.location
    if (hostname === 'music.youtube.com') {
        createTopMiddleContent()
        createTopRightContent()
        createBottomPlayerBarContent()
        playerBarScrollToChangeVolume()
        enableAVSwitcher()
    } else createOffTheRoadContent()

    document.addEventListener('yt-popup-opened', function (e) {
        // console.log("browse : ", e.target.children[0].getAttribute('href').includes('browse'));
        // console.log("playlist : ", e.target.children[0].getAttribute('href').includes('playlist'));

        // let clickedElement = e.target.children[0].getAttribute('href')
        if (e.target.children[0].getAttribute('href').includes('browse')) {
            createSendSongButton()
        } else if (
            e.target.children[0].getAttribute('href').includes('playlist')
        ) {
            createSendPlaylistButton()
        }
    })

    // injectCast()
    loadAudioOutputList()
})

function createContextMenu() {
    try {
        const materialIcons = document.createElement('link')
        materialIcons.setAttribute(
            'href',
            'https://fonts.googleapis.com/icon?family=Material+Icons'
        )
        materialIcons.setAttribute('rel', 'stylesheet')

        document.body.prepend(materialIcons)
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createContextMenu',
        })
    }

    try {
        const css = document.createElement('style')
        css.appendChild(
            document.createTextNode(
                `
                #ytmd-menu {
                    visibility: hidden;
                    opacity: 0;
                    position: fixed;
                    background: #232323;
                    font-family: sans-serif;

                    -webkit-transition: opacity .2s ease-in-out;
                    transition: opacity .2s ease-in-out;

                    padding: 0 !important;

                    border: 1px solid rgba(255, 255, 255, .08) !important;
                    border-radius: 2px !important;

                    z-index: 999999 !important;

                    width: 144px;
                }

                #ytmd-menu a {
                    color: #AAA;
                    display: inline-block;
                    cursor: pointer;

                    padding: 10px 12px 6px 12px;
                }

                #ytmd-menu a:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                }

                .divider {
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    height: 21px;
                    display: inline-block;
                }

                .hide {
                    visibility: hidden;
                    width: 0 !important;
                    height: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                }

                .pointer {
                    cursor: pointer;
                }

                .shine:hover {
                    color: #FFF !important;
                }

                .ytmd-icons {
                    margin: 0 18px 0 2px !important;
                    color: rgba(255, 255, 255, 0.5) !important;
                }

                .ytmd-button-rounded {
                    margin: 0 0 0 10px;

                    width: 40px;
                    height: 40px;

                    padding: 6px;

                    border: 0;

                    color: #999;

                    background: rgba(255, 255, 255, 0);
                    border-radius: 50%;
                }

                .ytmd-button-rounded:hover {
                    background: rgba(255, 255, 255, .1);
                }

                .ytmd-icons-middle {
                    margin: 0 10px 0 18px !important;
                }

                .center-content {
                    padding-top: 12px;
                }

                .btn-disabled {
                    color: #000 !important;
                }

                .text-red {
                    color: red !important;
                }

                .ytmd-modal {
                    display: none; /* Hidden by default */
                    position: fixed; /* Stay in place */
                    z-index: 99; /* Sit on top */
                    left: 0;
                    top: 0;
                    width: 100%; /* Full width */
                    height: 100%; /* Full height */
                    background-color: rgb(0,0,0); /* Fallback color */
                    background-color: rgba(0,0,0,0.4); /* Black w/ opacity */
                    overflow: hidden
                  }

                  /* Modal Content */
                  .ytmd-modal-content {
                    background: #232323;
                    font-family: Arial, Helvetica, sans-serif;
                    padding: 20px;
                    border: 1px solid #888;
                    width: 80%;
                    max-width: 300px;
                    transition: 0.3s;
                    color: white;
                    opacity: 95%;
                    font-size: 15px;
                  }

                  .ytmd-modal-content-title {
                    color: white;
                    opacity: 100% !important;
                    margin: 0;
                    width: 100%;
                    font-size: 20px;
                    padding-bottom: 5px;
                  }
                  .ytmd-modal-close {
                    color: #aaaaaa;
                    float: right;
                    font-size: 28px;
                    font-weight: bold;
                  }

                  .ytmd-modal-close:hover,
                  .ytmd-modal-close:focus {
                    color: #000;
                    text-decoration: none;
                    cursor: pointer;
                  }
            `
            )
        )
        document.head.appendChild(css)
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createContextMenu insertCSS',
        })
    }

    let quickShortcuts = ''
    quickShortcuts += `<a id="ytmd-menu-lyrics"><i class="material-icons">music_note</i></a>`
    quickShortcuts += `<a id="ytmd-menu-miniplayer"><i class="material-icons">picture_in_picture_alt</i></a>`
    quickShortcuts += `<a id="ytmd-menu-bug-report"><i class="material-icons text-red">bug_report</i></a>`

    try {
        const menuDiv = document.createElement('div')
        menuDiv.setAttribute('id', 'ytmd-menu')
        menuDiv.innerHTML = quickShortcuts
        document.body.prepend(menuDiv)
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createContextMenu prepend',
        })
    }

    // LISTENERS FOR MENU OPTIONS
    try {
        const menuElement = document.getElementById('ytmd-menu').style

        const buttonOpenCompanion = document.getElementById(
            'ytmd-menu-companion-server'
        )
        const buttonOpenMiniplayer = document.getElementById(
            'ytmd-menu-miniplayer'
        )
        const buttonOpenLyrics = document.getElementById('ytmd-menu-lyrics')
        const buttonOpenBugReport = document.getElementById(
            'ytmd-menu-bug-report'
        )
        const buttonPageOpenMiniplayer = document.getElementsByClassName(
            'player-minimize-button ytmusic-player'
        )[0]

        document.addEventListener(
            'contextmenu',
            (e) => {
                const posX = e.clientX
                const posY = e.clientY
                showMenu(posX, posY)
                e.preventDefault()
            },
            false
        )
        document.addEventListener(
            'click',
            (_) => {
                menuElement.opacity = '0'
                setTimeout(() => {
                    menuElement.visibility = 'hidden'
                }, 501)
            },
            false
        )

        if (buttonOpenCompanion)
            buttonOpenCompanion.addEventListener('click', () => {
                ipcRenderer.send('window', { command: 'show-companion' })
            })

        if (buttonOpenLyrics)
            buttonOpenLyrics.addEventListener('click', () => {
                ipcRenderer.send('window', { command: 'show-lyrics' })
            })

        if (buttonOpenMiniplayer)
            buttonOpenMiniplayer.addEventListener('click', () => {
                ipcRenderer.send('window', { command: 'show-miniplayer' })
            })

        if (buttonPageOpenMiniplayer)
            buttonPageOpenMiniplayer.addEventListener('click', (_) => {
                /* Temporary fix */
                document
                    .getElementsByClassName(
                        'player-maximize-button ytmusic-player'
                    )[0]
                    .click()
                ipcRenderer.send('window', { command: 'show-miniplayer' })
            })

        if (buttonOpenBugReport)
            buttonOpenBugReport.addEventListener('click', () => {
                ipcRenderer.send('bug-report')
            })

        // TODO: This shouldn't be here
        function showMenu(x, y) {
            menuElement.top = y + 'px'
            menuElement.left = x + 'px'
            menuElement.visibility = 'visible'
            menuElement.opacity = '1'
        }
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createContextMenu listeners',
        })
    }
}

function createTopMiddleContent() {
    try {
        const center_content = document.getElementsByTagName(
            'ytmusic-pivot-bar-renderer'
        )[0]

        // HISTORY BACK
        const back_element = document.createElement('i')
        back_element.id = 'ytmd_history_back'
        back_element.classList.add(
            'material-icons',
            'pointer',
            'shine',
            'ytmd-icons',
            'center-content'
        )
        back_element.innerText = 'keyboard_backspace'

        back_element.addEventListener('click', function () {
            history.go(-1)
        })

        // HISTORY FORWARD
        const forward_element = document.createElement('i')
        forward_element.id = 'ytmd_history_forward'
        forward_element.classList.add(
            'material-icons',
            'pointer',
            'shine',
            'ytmd-icons',
            'center-content'
        )
        forward_element.style.cssText = 'transform: rotate(180deg);'
        forward_element.innerText = 'keyboard_backspace'

        forward_element.addEventListener('click', function () {
            history.forward()
        })

        center_content.prepend(forward_element)
        center_content.prepend(back_element)
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createTopMiddleContent',
        })
    }
}

function createSendSongButton() {
    try {
        const rightClickPopupContainer = document.getElementsByTagName(
            'tp-yt-paper-listbox'
        )[0]

        const addSongElement = rightClickPopupContainer.children[0].cloneNode(
            true
        )
        rightClickPopupContainer.append(addSongElement)

        //TODO: Llorar
        //TODO: después de llorar, no muestra el texto porque el formatted-string tiene el atributo is empty en cuanto se lo quitas y le seteas el innerText funciona
        //pero no soy capaz de quitar el is-empty, ya pa otro dia
        console.log(addSongElement.getElementsByClassName('text'))
        // addSongElement
        //     .getElementsByTagName('text')
        //     .querySelector('.yt-formatted-string').innerText = 'Send Song'

        // addSongElement.classList.add(
        //     'ytmusic-menu-popup-renderer',
        //     'style-scope',
        //     'iron-selected'
        // )

        // // addSongElement.innerText = 'Send a song to server'
        // addSongElement.innerHTML = '<a id="navigation-endpoint" class="yt-simple-endpoint style-scope ytmusic-menu-navigation-item-renderer" tabindex="-1" href="watch?playlist=OLAK5uy_lQd04V9bQ2-_1MVNR0sUJvBPwmyRkgZAk">' +
        //   '<yt-icon class="icon style-scope ytmusic-menu-navigation-item-renderer"><svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" class="style-scope yt-icon" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g class="style-scope yt-icon"><path fill-rule="evenodd" clip-rule="evenodd" d="M16.808 4.655l2.069 1.978h-.527c-1.656 0-3.312.68-4.458 1.814L12.797 9.75l1.179 1.246 1.317-1.527c.764-.794 1.91-1.247 3.057-1.247h.55l-2.07 2.014 1.178 1.179 4.005-3.993-4.026-3.945-1.178 1.179zm1.974 10.998l-1.974-1.888 1.18-1.179 4.024 3.945-4.004 3.993-1.178-1.179 1.954-1.901h-.434c-1.656 0-3.312-.625-4.458-1.667L8.242 9.8C7.35 9.071 6.204 8.55 4.93 8.55H2l.006-1.794 2.965.003c1.784 0 3.312.521 4.459 1.563l5.904 6.185c.765.73 1.911 1.146 3.058 1.146h.39zm-9.02-2.092l-1.52 1.394c-.892.793-2.038 1.36-3.312 1.36H2v1.588h2.93c1.783 0 3.312-.567 4.459-1.701l1.537-1.396-1.164-1.245z" class="style-scope yt-icon"></path></g></svg><!--css-build:shady--></yt-icon>' +
        //   '<yt-formatted-string class="text style-scope ytmusic-menu-navigation-item-renderer">Send Song</yt-formatted-string>' +
        // '</a>'

        // const iconElement = document.createElement('i');
        // iconElement.id = 'ytmp_icon'
        // iconElement.classList.add(
        //     'material-icons',
        //     'left',
        //     'icon-normalize'
        // )
        // addSongElement.prepend(iconElement);
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createAddSongButton',
        })
    }
}

function createSendPlaylistButton() {
    try {
        const rightClickPopupContainer = document.getElementsByTagName(
            'tp-yt-paper-listbox'
        )[0]

        console.log(rightClickPopupContainer)

        const addPlaylistElement = document.createElement('i')
        addPlaylistElement.id = 'ytmp_send_playlist'
        addPlaylistElement.classList.add(
            'yt-simple-endpoint',
            'style-scope',
            'ytmusic-menu-navigation-item-renderer'
        )
        addPlaylistElement.innerText = 'Send playlist to server'

        rightClickPopupContainer.prepend(addPlaylistElement)
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createAddSongButton',
        })
    }
}

function createTopRightContent() {
    const settingsRemoteServer = settingsGet('settings-companion-server')

    // ADD BUTTONS TO RIGHT CONTENT (side to the photo)
    try {
        const right_content = document.getElementById('right-content')

        //SHUTDOWN
        if (!isWindows()) {
            const elementShutdown = document.createElement('i')
            elementShutdown.id = 'ytmd_shutdown'
            elementShutdown.title = translate('LABEL_SHUTDOWN')
            elementShutdown.classList.add(
                'material-icons',
                'pointer',
                'shine',
                'ytmd-icons'
            )
            elementShutdown.innerText = 'power_settings_new'

            elementShutdown.addEventListener('click', function () {
                ipcRenderer.send('closed')
            })

            right_content.prepend(elementShutdown)
        }

        // SETTINGS
        const elementSettings = document.createElement('i')
        elementSettings.id = 'ytmd_settings'
        elementSettings.title = translate('LABEL_SETTINGS')
        elementSettings.classList.add(
            'material-icons',
            'pointer',
            'shine',
            'ytmd-icons'
        )
        elementSettings.innerText = 'settings'

        elementSettings.addEventListener('click', () => {
            ipcRenderer.send('window', { command: 'show-settings' })
        })

        right_content.prepend(elementSettings)

        // REMOTE SERVER
        const elementRemoteServer = document.createElement('i')
        elementRemoteServer.id = 'ytmd_remote_server'
        elementRemoteServer.title = translate(
            'LABEL_SETTINGS_TAB_GENERAL_COMPANION_SERVER'
        )
        elementRemoteServer.classList.add(
            'material-icons',
            'pointer',
            'shine',
            'ytmd-icons',
            'hide'
        )
        elementRemoteServer.innerText = 'devices_other'

        elementRemoteServer.addEventListener('click', () => {
            ipcRenderer.send('window', { command: 'show-companion' })
        })

        right_content.prepend(elementRemoteServer)

        if (settingsRemoteServer)
            document
                .getElementById('ytmd_remote_server')
                .classList.remove('hide')

        settingsOnDidChange('settings-companion-server', (data) => {
            if (data.newValue)
                document
                    .getElementById('ytmd_remote_server')
                    .classList.remove('hide')
            else
                document
                    .getElementById('ytmd_remote_server')
                    .classList.add('hide')
        })

        // UPDATE
        const elementUpdate = document.createElement('i')
        elementUpdate.id = 'ytmd_update'
        elementUpdate.classList.add(
            'material-icons',
            'green-text',
            'pointer',
            'shine',
            'ytmd-icons',
            'hide'
        )
        elementUpdate.style.color = '#4CAF50'
        elementUpdate.innerText = 'arrow_downward'

        elementUpdate.addEventListener('click', () => {
            ipcRenderer.send('btn-update-clicked', true)
        })

        right_content.prepend(elementUpdate)

        ipcRenderer.on('downloaded-new-update', (e, data) => {
            document.getElementById('ytmd_update').classList.remove('hide')
        })
    } catch (err) {
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createTopRightContent',
        })
    }
}

function createPlayerColorRules() {
    try {
        const css = document.createElement('style')
        css.appendChild(
            document.createTextNode(
                `
                :root{
                    --ytm-album-color-muted: #000000;
                    --ytm-album-color-vibrant: #232323;
                }

                ytmusic-app-layout{
                    --ytmusic-nav-bar: #000000; /* default for collapsed player */
                }

                ytmusic-app-layout.content-scrolled{
                    --ytmusic-nav-bar: #232323; /* default for collapsed player */
                }

                body[accent-enabled] ytmusic-app-layout[player-page-open_]{
                    --ytmusic-nav-bar: var(--ytm-album-color-muted);
                    --ytmusic-brand-background-solid: var(--ytm-album-color-vibrant);
                }

                body[accent-enabled] #progress-bar {
                    --paper-slider-active-color: white;
                    --paper-slider-knob-color: transparent;
                }

                body[accent-enabled] yt-page-navigation-progress{
                    --yt-page-navigation-container-color: #232323;
                    --yt-page-navigation-progress-color: white;
                }

                body[accent-enabled][player-open] yt-page-navigation-progress{
                    --yt-page-navigation-container-color: var(--ytm-album-color-muted);
                    --yt-page-navigation-progress-color: white;
                }

                body[accent-enabled] #player-page{
                    background: var(--ytm-album-color-muted);
                }

                body[accent-enabled] #progress-bar.ytmusic-player-bar[focused],
                body[accent-enabled] ytmusic-player-bar:hover #progress-bar.ytmusic-player-bar{
                    --paper-slider-knob-color: white;
                }
                `
            )
        )
        document.head.appendChild(css)
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createPlayerColorRules insertCSS',
        })
    }
}

function createBottomPlayerBarContent() {
    const shortcutButtons = settingsGet('settings-shortcut-buttons')

    try {
        const playerBarRightControls = document.querySelector(
            '.right-controls-buttons.ytmusic-player-bar'
        )
        const playerBarMiddleControls = document.querySelector(
            '.middle-controls-buttons.ytmusic-player-bar'
        )

        // Middle ////////////////////////////////////////////////////////////////////////////////////
        // Add to Playlist
        const elementAddToPlaylistIcon = document.createElement('i')
        const elementAddToPlaylistButton = document.createElement('button')

        elementAddToPlaylistIcon.id = 'ytmd_add_to_playlist'
        elementAddToPlaylistIcon.title = translate('ADD_TO_PLAYLIST')
        elementAddToPlaylistIcon.classList.add('material-icons')
        elementAddToPlaylistIcon.innerText = 'playlist_add'

        elementAddToPlaylistButton.id = 'btn_ytmd_add_to_playlist'
        elementAddToPlaylistButton.classList.add('ytmd-button-rounded', 'hide')
        elementAddToPlaylistButton.append(elementAddToPlaylistIcon)

        elementAddToPlaylistButton.addEventListener('click', () => {
            const popup = document.querySelector('.ytmusic-menu-popup-renderer')
            const addPlaylist = Array.from(popup.children)
                .filter(
                    (value) =>
                        value
                            .querySelector('g path:not([fill])')
                            .getAttribute('d') ===
                        'M14 10H2v2h12v-2zm0-4H2v2h12V6zm4 8v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM2 16h8v-2H2v2z'
                )[0]
                .querySelector('a')
            addPlaylist.click()
        })

        playerBarMiddleControls.insertBefore(
            elementAddToPlaylistButton,
            playerBarMiddleControls.children.item(1)
        )

        if (shortcutButtons['add-to-playlist'])
            document
                .querySelector('#btn_ytmd_add_to_playlist')
                .classList.remove('hide')

        settingsOnDidChange(
            'settings-shortcut-buttons.add-to-playlist',
            (data) => {
                if (data.newValue)
                    document
                        .querySelector('#btn_ytmd_add_to_playlist')
                        .classList.remove('hide')
                else
                    document
                        .querySelector('#btn_ytmd_add_to_playlist')
                        .classList.add('hide')
            }
        )

        // Add to Library
        const elementAddToLibraryIcon = document.createElement('i')
        const elementAddToLibraryButton = document.createElement('button')

        elementAddToLibraryIcon.id = 'ytmd_add_to_library'
        elementAddToLibraryIcon.title = translate('ADD_TO_LIBRARY')
        elementAddToLibraryIcon.classList.add('material-icons')
        elementAddToLibraryIcon.innerText = 'library_add'
        elementAddToLibraryButton.id = 'btn_ytmd_add_to_library'
        elementAddToLibraryButton.classList.add('ytmd-button-rounded', 'hide')
        elementAddToLibraryButton.append(elementAddToLibraryIcon)

        elementAddToLibraryButton.addEventListener('click', () => {
            ipcRenderer.send('media-command', { command: 'media-add-library' })
        })

        playerBarMiddleControls.insertBefore(
            elementAddToLibraryButton,
            playerBarMiddleControls.children.item(1)
        )

        let showAddToLibrary = false
        if (shortcutButtons['add-to-library']) {
            document
                .querySelector('#btn_ytmd_add_to_library')
                .classList.remove('hide')
            showAddToLibrary = true
        }

        settingsOnDidChange(
            'settings-shortcut-buttons.add-to-library',
            (data) => {
                if (data.newValue) {
                    showAddToLibrary = true
                    document
                        .querySelector('#btn_ytmd_add_to_library')
                        .classList.remove('hide')
                } else {
                    showAddToLibrary = false
                    document
                        .querySelector('#btn_ytmd_add_to_library')
                        .classList.add('hide')
                }
            }
        )

        setInterval(() => {
            const popup = document.querySelector('.ytmusic-menu-popup-renderer')
            let addLibrary
            if (popup) {
                addLibrary = Array.from(popup.children).filter(
                    (value) =>
                        value
                            .querySelector('g path:not([fill])')
                            .getAttribute('d') ===
                            'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7.53 12L9 10.5l1.4-1.41 2.07 2.08L17.6 6 19 7.41 12.47 14zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z' ||
                        value
                            .querySelector('g path:not([fill])')
                            .getAttribute('d') ===
                            'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z'
                )[0]
            }

            if (addLibrary !== undefined && showAddToLibrary) {
                const _d = addLibrary
                    .querySelector('g path:not([fill])')
                    .getAttribute('d')

                if (
                    _d ===
                    'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7.53 12L9 10.5l1.4-1.41 2.07 2.08L17.6 6 19 7.41 12.47 14zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z'
                ) {
                    document.querySelector('#ytmd_add_to_library').innerText =
                        'check'
                    document.querySelector(
                        '#ytmd_add_to_library'
                    ).title = translate('REMOVE_FROM_LIBRARY')
                } else {
                    document.querySelector('#ytmd_add_to_library').innerText =
                        'library_add'
                    document.querySelector(
                        '#ytmd_add_to_library'
                    ).title = translate('ADD_TO_LIBRARY')
                }
                document
                    .querySelector('#btn_ytmd_add_to_library')
                    .classList.remove('hide')
            } else
                document
                    .querySelector('#btn_ytmd_add_to_library')
                    .classList.add('hide')
        }, 800)

        // Right ////////////////////////////////////////////////////////////////////////////////////
        // Lyrics
        const elementLyrics = document.createElement('i')
        elementLyrics.id = 'ytmd_lyrics'
        elementLyrics.title = translate('LYRICS')
        elementLyrics.classList.add(
            'material-icons',
            'pointer',
            'ytmd-icons',
            'hide'
        )
        elementLyrics.innerText = 'music_note'

        elementLyrics.addEventListener('click', () => {
            ipcRenderer.send('window', { command: 'show-lyrics' })
        })
        playerBarRightControls.append(elementLyrics)

        if (shortcutButtons.lyrics)
            document.querySelector('#ytmd_lyrics').classList.remove('hide')

        settingsOnDidChange('settings-shortcut-buttons.lyrics', (data) => {
            if (data.newValue) {
                document.querySelector('#ytmd_lyrics').classList.remove('hide')
                document
                    .querySelector('#ytmd_lyrics')
                    .classList.add('ytmd-icons')
            } else {
                document.querySelector('#ytmd_lyrics').classList.add('hide')
                document
                    .querySelector('#ytmd_lyrics')
                    .classList.remove('ytmd-icons')
            }
        })

        // Miniplayer
        const elementMiniplayer = document.createElement('i')
        elementMiniplayer.id = 'ytmd_miniplayer'
        elementMiniplayer.title = translate('MINIPLAYER')
        elementMiniplayer.classList.add(
            'material-icons',
            'pointer',
            'ytmd-icons',
            'hide'
        )
        elementMiniplayer.innerText = 'picture_in_picture_alt'

        elementMiniplayer.addEventListener('click', () => {
            ipcRenderer.send('window', { command: 'show-miniplayer' })
        })
        playerBarRightControls.append(elementMiniplayer)

        // Sleep timer
        const elementSleepTimer = document.createElement('i')
        elementSleepTimer.id = 'ytmd_sleeptimer'
        elementSleepTimer.title = translate('SLEEPTIMER')
        elementSleepTimer.classList.add(
            'material-icons',
            'pointer',
            'ytmd-icons'
        )
        elementSleepTimer.innerText = 'timer'

        const elementSleepTimerModal = document.createElement('div')
        const elementSleepTimerModalContent = document.createElement('div')
        const elementSleepTimerSet = document.createElement('button')
        const elementSleepTimerClear = document.createElement('button')
        const elementSleepTimerCloseModal = document.createElement('span')

        elementSleepTimerModal.classList.add('ytmd-modal')
        elementSleepTimerModal.id = 'ytmd_sleeptimer_modal'
        elementSleepTimerModal.append(elementSleepTimerModalContent)

        elementSleepTimerModalContent.innerHTML = `
                <p class="ytmd-modal-content-title">${translate(
                    'SLEEPTIMER'
                )}</p>
                <div> ${translate('SLEEP_BY_TIME')}
                    <br/>
                    <input name='sleep_timer' type='radio' id='sleep-timer-30min' value='30'/>
                    <label for='sleep-timer-30min'> 30${translate(
                        'SLEEPTIMER_MINUTES'
                    )}</label>
                    <input name='sleep_timer' type='radio' id='sleep-timer-1h' value='60'/>
                    <label for='sleep-timer-1h'>60${translate(
                        'SLEEPTIMER_MINUTES'
                    )}</label>
                    <input name='sleep_timer' type='radio' id='sleep-timer-2h' value='120'/>
                    <label for='sleep-timer-2h'>120${translate(
                        'SLEEPTIMER_MINUTES'
                    )}</label>
                    <br/><input name='sleep_timer' type='radio' id='sleep-timer-customized'/>
                    <input id='sleep-timer-minutes' for='sleep-timer-customized' style='width: 40px'/>
                    <label for='sleep-timer-minutes'>${translate(
                        'SLEEPTIMER_MINUTES'
                    )}</>
                </div>
                <div style='margin-top: 15px;'> ${translate('SLEEP_BY_COUNTER')}
                    <br/>
                    <input name='sleep_timer' type='radio' id='sleep-timer-5c' value='5c'/>
                    <label for='sleep-timer-5c'>5</label>
                    <input name='sleep_timer' type='radio' id='sleep-timer-10c' value='10c'/>
                    <label for='sleep-timer-10c'>10</label>
                    <input name='sleep_timer' type='radio' id='sleep-timer-30c' value='30c'/>
                    <label for='sleep-timer-30c'>30</label>
                    <br/><input name='sleep_timer' type='radio' id='sleep-timer-customized-c' />
                    <input id='sleep-timer-songs' for='sleep-timer-customized-c' style='width: 40px'/>
                    <label for='sleep-timer-songs'>${translate(
                        'SLEEPTIMER_SONGS'
                    )}</>
                </div>
        `
        elementSleepTimerModalContent.append(elementSleepTimerSet)
        elementSleepTimerModalContent.append(elementSleepTimerClear)

        elementSleepTimerModalContent.prepend(elementSleepTimerCloseModal)

        elementSleepTimer.addEventListener('click', (e) => {
            ipcRenderer.send('retrieve-sleep-timer')
            elementSleepTimerModal.style.display = 'block'
            elementSleepTimerModalContent.style.marginLeft = e.x + 'px' // pop out at mouse position
            elementSleepTimerModalContent.style.marginTop = e.y + 'px'
            elementSleepTimerModalContent.style.transform =
                'translate(-50%, -50%) scale(0)' // animation
            setTimeout(() => {
                elementSleepTimerModalContent.style.transform =
                    'translate(-100%, -100%) scale(1)'
            }, 10) // animation
        })

        elementSleepTimerCloseModal.innerHTML = '&times;'
        elementSleepTimerCloseModal.classList.add('ytmd-modal-close')
        elementSleepTimerCloseModal.addEventListener('click', () => {
            elementSleepTimerModal.style.display = 'none'
        })
        elementSleepTimerModal.addEventListener('click', (e) => {
            if (e.target === elementSleepTimerModal)
                elementSleepTimerModal.style.display = 'none' // close modal
        })

        elementSleepTimerModalContent.classList.add('ytmd-modal-content')

        elementSleepTimerSet.innerText = translate('SLEEPTIMER_SET')

        elementSleepTimerSet.addEventListener('click', () => {
            var value = document.querySelector(
                'input[name="sleep_timer"]:checked'
            ).value
            if (value) {
                ipcRenderer.send('set-sleep-timer', { value: value })
                elementSleepTimerModal.style.display = 'none'
            }
        })

        elementSleepTimerClear.innerText = translate('SLEEPTIMER_CLEAR')
        elementSleepTimerClear.style.marginLeft = '15px'
        elementSleepTimerClear.addEventListener('click', () => {
            ipcRenderer.send('set-sleep-timer', { value: 0 })
            elementSleepTimerModal.style.display = 'none'
        })
        playerBarRightControls.append(elementSleepTimer)
        document.body.append(elementSleepTimerModal)

        document.getElementById(
            'sleep-timer-minutes'
        ).onkeydown = document.getElementById(
            // use the same function when change/keydown
            'sleep-timer-minutes'
        ).onchange = (e) => {
            var radio = document.getElementById('sleep-timer-customized')
            radio.checked = true
            radio.value = parseInt(e.target.value)
        }

        document.getElementById(
            'sleep-timer-songs'
        ).onkeydown = document.getElementById('sleep-timer-songs').onchange = (
            // use the same function when change/keydown
            e
        ) => {
            var radio = document.getElementById('sleep-timer-customized-c')
            radio.checked = true
            radio.value = parseInt(e.target.value) + 'c'
        }

        ipcRenderer.on('sleep-timer-info', (_, mode, counter) => {
            if (mode == 'time') {
                elementSleepTimerClear.disabled = false
                elementSleepTimerSet.innerText = translate('SLEEPTIMER_RESET')
                var radio = document.getElementById('sleep-timer-customized')
                radio.checked = true
                radio.value = counter
                document.getElementById('sleep-timer-minutes').value = counter
            } else if (mode == 'counter') {
                elementSleepTimerClear.disabled = false
                elementSleepTimerSet.innerText = translate('SLEEPTIMER_RESET')
                var radio = document.getElementById('sleep-timer-customized-c')
                radio.checked = true
                radio.value = counter
                document.getElementById('sleep-timer-songs').value = counter
            } else {
                elementSleepTimerClear.disabled = true
                elementSleepTimerSet.innerText = translate('SLEEPTIMER_SET')
            }
        })

        if (shortcutButtons.miniplayer)
            document.querySelector('#ytmd_miniplayer').classList.remove('hide')

        settingsOnDidChange('settings-shortcut-buttons.miniplayer', (data) => {
            if (data.newValue) {
                document
                    .querySelector('#ytmd_miniplayer')
                    .classList.remove('hide')
                document
                    .querySelector('#ytmd_miniplayer')
                    .classList.add('ytmd-icons')
            } else {
                document.querySelector('#ytmd_miniplayer').classList.add('hide')
                document
                    .querySelector('#ytmd_miniplayer')
                    .classList.remove('ytmd-icons')
            }
        })

        // Volume slider
        document.querySelector('#volume-slider').setAttribute('step', 0)
        document.querySelector('#expand-volume-slider').setAttribute('step', 0)
        document
            .querySelector('#volume-slider')
            .addEventListener('value-change', (e) => {
                ipcRenderer.send('change-volume', {
                    volume: e.target.getAttribute('value'),
                })
            })
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createBottomPlayerBarContent',
        })
    }
}

function enableAVSwitcher() {
    const player = document.getElementById('player')
    const player_page = document.getElementById('player-page')

    player.setAttribute('has-av-switcher', '')
    player_page.setAttribute('has-av-switcher', '')
}

function playerBarScrollToChangeVolume() {
    try {
        const playerBar = document.getElementsByTagName('ytmusic-player-bar')[0]

        const volumeSlider = document.getElementById('volume-slider')
        let isVolumeSliderHovered = false
        volumeSlider.addEventListener(
            'mouseover',
            () => (isVolumeSliderHovered = true)
        )
        volumeSlider.addEventListener(
            'mouseout',
            () => (isVolumeSliderHovered = false)
        )

        const expandVolumeSlider = document.getElementById(
            'expand-volume-slider'
        )
        let isExpandVolumeSliderHovered = false
        expandVolumeSlider.addEventListener(
            'mouseover',
            () => (isExpandVolumeSliderHovered = true)
        )
        expandVolumeSlider.addEventListener(
            'mouseout',
            () => (isExpandVolumeSliderHovered = false)
        )

        const isSliderHovered = () =>
            isExpandVolumeSliderHovered || isVolumeSliderHovered

        playerBar.addEventListener('wheel', (ev) => {
            ev.preventDefault()
            if (!settingsGet('settings-decibel-volume') && isSliderHovered()) {
                return
            }

            if (ev.deltaY < 0)
                ipcRenderer.send('media-command', {
                    command: 'media-volume-up',
                })
            else
                ipcRenderer.send('media-command', {
                    command: 'media-volume-down',
                })
        })
    } catch (err) {
        console.error(err)
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on playerBarScrollToChangeVolume',
        })
    }
}

function createOffTheRoadContent() {
    try {
        const { body } = document

        const elementBack = document.createElement('i')
        elementBack.id = 'ytmd_lyrics'
        elementBack.classList.add('material-icons')
        elementBack.style.cursor = 'pointer'
        elementBack.style.fontSize = '42px'
        elementBack.style.zIndex = '9999999'
        elementBack.style.position = 'fixed'
        elementBack.style.cssFloat = 'left'
        elementBack.style.boxShadow = '0 0 2px #111'
        elementBack.style.background = '#1D1D1D'
        elementBack.style.color = '#FFF'
        elementBack.innerText = 'arrow_back'

        elementBack.addEventListener('click', () => {
            ipcRenderer.send('reset-url')
        })

        body.prepend(elementBack)
    } catch (err) {
        ipcRenderer.send('log', {
            type: 'warn',
            data: 'error on createOffTheRoadContent',
        })
    }
}

function injectCast() {
    // content
    //     .executeJavaScript(
    //         `
    //     // Todo
    //     `
    //     )
    //     .then((data) => {
    //         console.log(data)
    //     })
    //     .catch((err) => {
    //         console.log(err)
    //     })
}

function loadAudioOutputList() {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
        audioDevices = devices.filter((device) => device.kind === 'audiooutput')

        ipcRenderer.send(
            'set-audio-output-list',
            audioDevices.length ? JSON.stringify(audioDevices) : '[]'
        )
    })
}

navigator.mediaDevices.ondevicechange = loadAudioOutputList

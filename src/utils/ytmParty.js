const { ipcMain } = require('electron')

async function playSong(view, ytId) {
    await view.webContents.executeJavaScript(
        `var element = document.querySelector('.ytmusic-player-bar#play-pause-button').click()`
    )
    view.webContents.loadURL('https://music.youtube.com/watch?v=' + ytId)
}

module.exports = {
    playSong: playSong,
}

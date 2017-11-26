import Vue, {VNode} from 'vue';
import ContextMenu from './vue/context-menu/ContextMenu';
import App from './vue/components/App.vue'
import './content.scss';

class DownloadStatusBar {
    private app: Vue;
    protected _downloads: DownloadItem[] = [];
    protected statusBar: HTMLElement = DownloadStatusBar.makeStatusBarElement();

    constructor() {
        let self = this;

        if (document.getElementById("DownloadStatusBarContainer")) {
            this.statusBar = document.getElementById("DownloadStatusBarContainer")!;
        } else {
            document.body.appendChild(this.statusBar);
        }

        Vue.use(ContextMenu);

        let app = this.app = new Vue({
            el: "#DownloadStatusBarContainer",
            render(render): VNode {
                return render(App, {
                    props: {
                        downloads: self._downloads
                    }
                });
            }
        });

        app.$on('clearDownloads', () => {
            // Clear the locally stored downloads
            this.downloads = [];

            // Tell the background to clear it's downloads
            browser.runtime.sendMessage({event: 'clearDownloads'});

            // Close the context menu
            this.app.$contextMenu.close();
        });

        app.$on('clearDownload', (download: DownloadItem) => {
            // Filter out the cleared download
            this.downloads = this._downloads.filter(function (dl: DownloadItem) {
                return dl.id !== download.id;
            });

            // Tell the background process to clear the download
            browser.runtime.sendMessage({event: 'clearDownload', download: download});
        });

        app.$on('showDownload', (download: DownloadItem) => {
            // Tell the background process to open the download
            browser.runtime.sendMessage({event: 'showDownload', download: download});
        });

        app.$on('cancelDownload', (download: DownloadItem) => {
            browser.runtime.sendMessage({event: 'cancelDownload', download: download});
        });

        app.$on('pauseDownload', (download: DownloadItem) => {
            browser.runtime.sendMessage({event: 'pauseDownload', download: download});
        });

        app.$on('resumeDownload', (download: DownloadItem) => {
            browser.runtime.sendMessage({event: 'resumeDownload', download: download});
        });
    }

    set downloads(downloads: DownloadItem[]) {
        this._downloads = downloads;

        this.app.$forceUpdate();
    }

    private static makeStatusBarElement(): HTMLElement {
        let container = document.createElement('div');

        container.id = "DownloadStatusBarContainer";

        return container;
    }
}

let statusBar = new DownloadStatusBar();

browser.runtime.onMessage.addListener(function (downloads: DownloadItem[]) {
    statusBar.downloads = downloads;
});
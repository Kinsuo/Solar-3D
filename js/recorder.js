(function (global) {
    class AnimationRecorder {
        constructor(renderer) {
            this.renderer = renderer;
            this.canvas = renderer.domElement;
            this._recording = false;
            this._mediaRecorder = null;
            this._chunks = [];
            
            this._bindUI();
            this._updateButtons();
            this._setStatus('未录制');
        }

        start() {
            if (this._recording) return;
            try {
                // capture canvas stream at 30 fps
                const stream = this.canvas.captureStream(30);
                
                // Video options: priority to mp4/H.264, WebM/VP9, then default WebM
                let options = { mimeType: 'video/mp4' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm; codecs=vp9' };
                }
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm; codecs=vp8' };
                }
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = { mimeType: 'video/webm' };
                }
                
                this._mediaRecorder = new MediaRecorder(stream, Object.assign({}, options, {
                    videoBitsPerSecond: 8000000 // 8 Mbps
                }));
                
                this._chunks = [];
                this._mediaRecorder.ondataavailable = e => {
                    if (e.data && e.data.size > 0) {
                        this._chunks.push(e.data);
                    }
                };
                
                // Request data every 250ms
                this._mediaRecorder.start(250);
                this._recording = true;
                this._updateButtons();
                const type = (options.mimeType || '').split(';')[0];
                this._setStatus(`录制中 (${type})...`);
            } catch (e) {
                console.error('MediaRecorder start error:', e);
                this._setStatus('录制失败：' + (e.message || String(e)));
            }
        }

        async stop() {
            if (!this._recording) return;
            this._setStatus('正在处理...');
            this._updateButtons();
            
            await new Promise(resolve => {
                this._mediaRecorder.addEventListener('stop', resolve, { once: true });
                this._mediaRecorder.stop();
            });
            
            const mimeType = this._mediaRecorder.mimeType || 'video/webm';
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const blob = new Blob(this._chunks, { type: mimeType });
            
            this._chunks = [];
            this._recording = false;
            this._mediaRecorder = null;
            this._updateButtons();
            
            if (blob.size === 0) {
                this._setStatus('导出失败：未采集到有效数据');
                return;
            }
            
            this._downloadBlob(blob, ext);
            this._setStatus(`已保存动画录制 (${ext})`);
        }

        tick() {
            // tick is not needed for captureStream + MediaRecorder flow
        }

        _downloadBlob(blob, ext) {
            const stamp = new Date();
            const pad = n => String(n).padStart(2, '0');
            const name = '太阳系模拟_' + stamp.getFullYear() + pad(stamp.getMonth() + 1) + pad(stamp.getDate()) + '_' + pad(stamp.getHours()) + pad(stamp.getMinutes()) + pad(stamp.getSeconds()) + '.' + ext;
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            a.click();
            
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        }

        _bindUI() {
            const startBtn = document.getElementById('record-start-btn');
            const stopBtn = document.getElementById('record-stop-btn');
            if (startBtn) startBtn.addEventListener('click', () => this.start());
            if (stopBtn) stopBtn.addEventListener('click', () => this.stop());
        }

        _updateButtons() {
            const startBtn = document.getElementById('record-start-btn');
            const stopBtn = document.getElementById('record-stop-btn');
            if (startBtn) startBtn.disabled = this._recording;
            if (stopBtn) stopBtn.disabled = !this._recording;
        }

        _setStatus(text) {
            const el = document.getElementById('record-status');
            if (el) el.textContent = text;
        }
    }

    global.AnimationRecorder = AnimationRecorder;
})(typeof window !== 'undefined' ? window : this);

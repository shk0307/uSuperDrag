const ignoreBoxSize = 50;

class Coords {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

chrome.storage.sync.get({
  enableTextSearch: true,
  searchUrl: 'https://www.google.com/search?q=%s',
  enableLinkOpen: true,
  enableLinkTextSelect: false
}, items => {
  if (items.enableTextSearch || items.enableLinkOpen) {
    const isTextArea = element => element.matches(
      'input[type="email"], input[type="number"], input[type="password"], input[type="search"], ' +
      'input[type="tel"], input[type="text"], input[type="url"], textarea'
    ) && !element.disabled;

    document.addEventListener('dragstart', event => {
      this.startCoords = new Coords(event.pageX, event.pageY);
    }, false);

    document.addEventListener('dragover', event => {
      if (event.dataTransfer.types.includes('text/uri-list')) {
        if (items.enableLinkOpen) {
          event.dataTransfer.dropEffect = 'link';
          event.preventDefault();
        }
      } else if (event.dataTransfer.types.includes('text/plain')) {
        if (items.enableTextSearch && !isTextArea(event.target)) {
          event.dataTransfer.dropEffect = 'link';
          event.preventDefault();
        }
      }
    }, false);

    document.addEventListener('drop', event => {
      if (event.dataTransfer.types.includes('text/uri-list')) {
        this.endCoords = new Coords(event.pageX, event.pageY);
        if (items.enableLinkOpen && validateEvent(startCoords, endCoords)) {
          const url = event.dataTransfer.getData('URL');
          chrome.runtime.sendMessage(url);
          event.preventDefault();
        }
      } else if (event.dataTransfer.types.includes('text/plain')) {
        this.endCoords = new Coords(event.pageX, event.pageY);
        if (items.enableTextSearch && !isTextArea(event.target) && validateEvent(startCoords, endCoords)) {
          const keyword = event.dataTransfer.getData('text/plain');
          const url = items.searchUrl.replace(/%s/gi, encodeURIComponent(keyword));
          chrome.runtime.sendMessage(url);
          event.preventDefault();
        }
      }
    }, false);
  }

  function validateEvent(startCoords, endCoords) {
    const x = Math.abs(startCoords.x - endCoords.x);
    const y = Math.abs(startCoords.y - endCoords.y);
    return (x > ignoreBoxSize || y > ignoreBoxSize)
  }

  if (items.enableLinkTextSelect) {
    // The original code is copyrighted by Griever and licensed under the MIT license.
    class LinkDragSelection {
      constructor() {
        this.init(...arguments);
      }
      init(event) {
        this.moved_flag = false;
        this.range = document.caretRangeFromPoint(event.clientX, event.clientY);
        const sel = getSelection();
        if (!sel.isCollapsed &&
            sel.getRangeAt(0).isPointInRange(this.range.startContainer, this.range.startOffset)) {
          return;
        }
        this.screenX = event.screenX;
        this.screenY = event.screenY;
        document.addEventListener('mousemove', this, false);
        document.addEventListener('mouseup', this, false);
      }
      uninit() {
        document.removeEventListener('mousemove', this, false);
        document.removeEventListener('mouseup', this, false);
        document.removeEventListener('dragstart', this, false);
        setTimeout(() => {
          document.removeEventListener('click', this, false);
        }, 100);
      }
      handleEvent(event) {
        switch(event.type) {
          case 'mousemove':
            if (this.moved_flag) {
              const range = document.caretRangeFromPoint(event.clientX, event.clientY);
              if (range) {
                getSelection().extend(range.startContainer, range.startOffset);
              }
            } else {
              this.moveX = event.screenX;
              this.moveY = event.screenY;
              this.checkXY();
            }
            break;
          case 'mouseup':
            this.uninit();
            break;
          case 'dragstart':
            event.currentTarget.removeEventListener(event.type, this, false);
            if (this.moved_flag) {
              event.preventDefault();
              event.stopPropagation();
            } else {
              this.checkXY();
            }
            break;
          case 'click':
            event.currentTarget.removeEventListener(event.type, this, false);
            if (!getSelection().isCollapsed) {
              event.preventDefault();
              event.stopPropagation();
            }
            break;
        }
      }
      selectionStart() {
        this.moved_flag = true;
        getSelection().collapse(this.range.startContainer, this.range.startOffset);
        document.addEventListener('dragstart', this, false);
        document.addEventListener('click', this, false);
      }
      checkXY() {
        const x = Math.abs(this.screenX - this.moveX);
        const y = Math.abs(this.screenY - this.moveY);
        if (x >= 4 && x > y) {
          this.selectionStart();
        } else if (y >= 4) {
          this.uninit();
        }
      }
    }
    document.addEventListener('mousedown', event => {
      if (event.button == 0 && !event.altKey && event.target.matches('a[href], a[href] *')) {
        new LinkDragSelection(event);
      }
    }, false);
  }
});

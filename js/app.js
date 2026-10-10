/* ============================================
   Sacred Texts Library — Application Logic
   ============================================ */
(function () {
    'use strict';

    // ── State ──
    const state = {
        currentView: 'home',    // home | reading | search | bookmarks
        currentBook: null,      // 'bible' | 'quran' | 'gita'
        currentChapterIdx: 0,
        fontSize: 1.1,          // rem
        theme: 'light',
        bookmarks: [],
    };

    // ── DOM refs ──
    const $ = id => document.getElementById(id);
    const homeView        = $('homeView');
    const readingView     = $('readingView');
    const searchResults   = $('searchResults');
    const bookmarksView   = $('bookmarksView');
    const chapterList     = $('chapterList');
    const chapterTitle    = $('chapterTitle');
    const chapterSubtitle = $('chapterSubtitle');
    const versesContainer = $('versesContainer');
    const sidebarTitle    = $('sidebarTitle');
    const breadcrumb      = $('breadcrumb');
    const searchInput     = $('searchInput');
    const searchBox       = $('searchBox');
    const searchToggle    = $('searchToggle');
    const bookmarkBtn     = $('bookmarkBtn');
    const fontControls    = $('fontControls');
    const sidebarToggle   = $('sidebarToggle');
    const chapterSidebar  = $('chapterSidebar');
    const toast           = $('toast');
    const prevBtn         = $('prevChapter');
    const nextBtn         = $('nextChapter');

    const bookNames = { bible: 'The Holy Bible', quran: 'The Holy Quran', gita: 'Bhagavad Gita' };

    // ── Initialise ──
    function init() {
        loadState();
        applyTheme();
        setupEventListeners();
        updateMeta();
        showContinueReading();
    }

    function loadState() {
        try {
            state.theme = localStorage.getItem('stl-theme') || 'light';
            state.fontSize = parseFloat(localStorage.getItem('stl-fontsize')) || 1.1;
            state.bookmarks = JSON.parse(localStorage.getItem('stl-bookmarks') || '[]');
        } catch { /* ignore */ }
    }

    function saveState() {
        localStorage.setItem('stl-theme', state.theme);
        localStorage.setItem('stl-fontsize', state.fontSize);
        localStorage.setItem('stl-bookmarks', JSON.stringify(state.bookmarks));
    }

    // ── Theme ──
    function applyTheme() {
        document.documentElement.setAttribute('data-theme', state.theme);
        $('themeToggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
    }

    function toggleTheme() {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        saveState();
    }

    // ── Meta counts on cards ──
    function updateMeta() {
        if (typeof SACRED_TEXTS === 'undefined') return;
        ['bible', 'quran', 'gita'].forEach(key => {
            const el = $(key + 'Meta');
            if (el && SACRED_TEXTS[key]) {
                el.textContent = SACRED_TEXTS[key].length + ' chapters available';
            }
        });
    }

    // ── Continue Reading ──
    function saveLastRead() {
        if (!state.currentBook) return;
        const ch = SACRED_TEXTS[state.currentBook][state.currentChapterIdx];
        localStorage.setItem('stl-lastread', JSON.stringify({
            book: state.currentBook,
            chapterIdx: state.currentChapterIdx,
            title: ch.title,
        }));
    }

    function showContinueReading() {
        try {
            const data = JSON.parse(localStorage.getItem('stl-lastread'));
            if (!data || !data.book || !SACRED_TEXTS[data.book]) return;
            const el = $('continueReading');
            $('continueChapter').textContent = bookNames[data.book] + ' — ' + data.title;
            el.style.display = 'flex';
            $('continueBtn').onclick = () => {
                state.currentBook = data.book;
                state.currentChapterIdx = data.chapterIdx;
                showView('reading');
                sidebarTitle.textContent = bookNames[state.currentBook];
                renderChapterList();
                renderChapter();
            };
        } catch { /* ignore */ }
    }

    // ── Navigation helpers ──
    function showView(view) {
        homeView.style.display = view === 'home' ? '' : 'none';
        readingView.style.display = view === 'reading' ? '' : 'none';
        searchResults.style.display = view === 'search' ? '' : 'none';
        bookmarksView.style.display = view === 'bookmarks' ? '' : 'none';

        const showReadingControls = (view === 'reading' || view === 'search');
        searchToggle.style.display = showReadingControls ? '' : 'none';
        bookmarkBtn.style.display  = (view === 'reading') ? '' : 'none';
        fontControls.style.display = (view === 'reading') ? '' : 'none';
        sidebarToggle.style.display = (view === 'reading') ? '' : 'none';

        state.currentView = view;
    }

    function goHome() {
        state.currentBook = null;
        showView('home');
        breadcrumb.innerHTML = '';
        searchBox.style.display = 'none';
        searchToggle.style.display = 'none';
        bookmarkBtn.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Book selection ──
    function openBook(bookKey) {
        if (!SACRED_TEXTS[bookKey]) return;
        state.currentBook = bookKey;
        state.currentChapterIdx = 0;
        showView('reading');
        sidebarTitle.textContent = bookNames[bookKey];
        renderChapterList();
        renderChapter();
    }

    // ── Chapter list ──
    function renderChapterList() {
        const chapters = SACRED_TEXTS[state.currentBook];
        chapterList.innerHTML = chapters.map((ch, i) =>
            `<li data-idx="${i}" class="${i === state.currentChapterIdx ? 'active' : ''}">${ch.title}</li>`
        ).join('');
    }

    // ── Render chapter ──
    function renderChapter() {
        const chapters = SACRED_TEXTS[state.currentBook];
        const ch = chapters[state.currentChapterIdx];
        if (!ch) return;

        chapterTitle.textContent = ch.title;
        chapterSubtitle.textContent = ch.subtitle || '';

        versesContainer.innerHTML = ch.verses.map(v =>
            `<p class="verse"><span class="verse-number">${v.number}</span><span class="verse-text">${v.text}</span></p>`
        ).join('');

        versesContainer.style.fontSize = state.fontSize + 'rem';

        // Update sidebar active
        chapterList.querySelectorAll('li').forEach(li => {
            li.classList.toggle('active', parseInt(li.dataset.idx) === state.currentChapterIdx);
        });
        // Scroll sidebar to active
        const activeLi = chapterList.querySelector('li.active');
        if (activeLi) activeLi.scrollIntoView({ block: 'nearest' });

        // Update nav buttons
        prevBtn.disabled = state.currentChapterIdx === 0;
        nextBtn.disabled = state.currentChapterIdx === chapters.length - 1;

        // Update breadcrumb
        updateBreadcrumb(ch.title);

        // Update bookmark button
        updateBookmarkBtn();

        // Save last read position
        saveLastRead();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updateBreadcrumb(chTitle) {
        breadcrumb.innerHTML =
            `<span class="sep">›</span>` +
            `<span>${bookNames[state.currentBook]}</span>` +
            `<span class="sep">›</span>` +
            `<span class="current">${chTitle}</span>`;
    }

    // ── Bookmark ──
    function updateBookmarkBtn() {
        const isBookmarked = state.bookmarks.some(b =>
            b.book === state.currentBook && b.chapterIdx === state.currentChapterIdx
        );
        bookmarkBtn.textContent = isBookmarked ? '🔖' : '📑';
        bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Add bookmark';
    }

    function toggleBookmark() {
        const idx = state.bookmarks.findIndex(b =>
            b.book === state.currentBook && b.chapterIdx === state.currentChapterIdx
        );
        if (idx >= 0) {
            state.bookmarks.splice(idx, 1);
            showToast('Bookmark removed');
        } else {
            const ch = SACRED_TEXTS[state.currentBook][state.currentChapterIdx];
            state.bookmarks.push({
                book: state.currentBook,
                chapterIdx: state.currentChapterIdx,
                title: ch.title,
                savedAt: new Date().toISOString(),
            });
            showToast('Bookmark saved!');
        }
        saveState();
        updateBookmarkBtn();
    }

    function showBookmarks() {
        showView('bookmarks');
        breadcrumb.innerHTML = '<span class="sep">›</span><span class="current">Bookmarks</span>';
        const list = $('bookmarksList');
        const noMsg = $('noBookmarks');

        if (state.bookmarks.length === 0) {
            list.innerHTML = '';
            noMsg.style.display = '';
            return;
        }

        noMsg.style.display = 'none';
        list.innerHTML = state.bookmarks.map((b, i) =>
            `<div class="bookmark-item">
                <div class="bookmark-info" data-book="${b.book}" data-idx="${b.chapterIdx}">
                    <div class="bookmark-book">${bookNames[b.book]}</div>
                    <div class="bookmark-chapter">${b.title}</div>
                </div>
                <button class="bookmark-remove" data-bi="${i}" title="Remove">✕</button>
            </div>`
        ).join('');

        list.querySelectorAll('.bookmark-info').forEach(el => {
            el.addEventListener('click', () => {
                state.currentBook = el.dataset.book;
                state.currentChapterIdx = parseInt(el.dataset.idx);
                showView('reading');
                sidebarTitle.textContent = bookNames[state.currentBook];
                renderChapterList();
                renderChapter();
            });
        });

        list.querySelectorAll('.bookmark-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                state.bookmarks.splice(parseInt(btn.dataset.bi), 1);
                saveState();
                showBookmarks();
                showToast('Bookmark removed');
            });
        });
    }

    // ── Search ──
    function performSearch(query) {
        if (!query || !state.currentBook) return;
        const chapters = SACRED_TEXTS[state.currentBook];
        const q = query.toLowerCase();
        const results = [];

        chapters.forEach((ch, ci) => {
            ch.verses.forEach(v => {
                if (v.text.toLowerCase().includes(q)) {
                    results.push({ chapterIdx: ci, chapterTitle: ch.title, verse: v, });
                }
            });
        });

        showView('search');
        const titleEl = $('searchResultsTitle');
        const listEl  = $('searchResultsList');

        titleEl.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}" in ${bookNames[state.currentBook]}`;

        if (results.length === 0) {
            listEl.innerHTML = '<p style="color:var(--text-muted);padding:20px;">No results found.</p>';
            return;
        }

        listEl.innerHTML = results.slice(0, 100).map(r => {
            const highlighted = r.verse.text.replace(
                new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                '<mark>$1</mark>'
            );
            return `<div class="search-result-item" data-ci="${r.chapterIdx}">
                <div class="search-result-chapter">${r.chapterTitle} — Verse ${r.verse.number}</div>
                <div class="search-result-text">${highlighted}</div>
            </div>`;
        }).join('');

        listEl.querySelectorAll('.search-result-item').forEach(el => {
            el.addEventListener('click', () => {
                state.currentChapterIdx = parseInt(el.dataset.ci);
                showView('reading');
                renderChapterList();
                renderChapter();
            });
        });
    }

    // ── Toast ──
    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
    }

    // ── Font size ──
    function changeFontSize(delta) {
        state.fontSize = Math.max(0.8, Math.min(2.0, state.fontSize + delta));
        versesContainer.style.fontSize = state.fontSize + 'rem';
        saveState();
    }

    // ── Event Listeners ──
    function setupEventListeners() {
        // Home button
        $('homeBtn').addEventListener('click', goHome);

        // Theme toggle
        $('themeToggle').addEventListener('click', toggleTheme);

        // Book cards
        document.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', () => openBook(card.dataset.book));
        });

        // Chapter list clicks
        chapterList.addEventListener('click', e => {
            const li = e.target.closest('li');
            if (!li) return;
            state.currentChapterIdx = parseInt(li.dataset.idx);
            renderChapter();
            // Close sidebar on mobile
            chapterSidebar.classList.remove('open');
        });

        // Prev / Next
        prevBtn.addEventListener('click', () => {
            if (state.currentChapterIdx > 0) {
                state.currentChapterIdx--;
                renderChapter();
            }
        });
        nextBtn.addEventListener('click', () => {
            const max = SACRED_TEXTS[state.currentBook].length - 1;
            if (state.currentChapterIdx < max) {
                state.currentChapterIdx++;
                renderChapter();
            }
        });

        // Search toggle
        searchToggle.addEventListener('click', () => {
            const open = searchBox.style.display !== 'none';
            searchBox.style.display = open ? 'none' : 'flex';
            if (!open) searchInput.focus();
        });
        $('searchCloseBtn').addEventListener('click', () => {
            searchBox.style.display = 'none';
            searchInput.value = '';
            if (state.currentView === 'search') {
                showView('reading');
                renderChapter();
            }
        });
        searchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                performSearch(searchInput.value.trim());
            }
        });

        // Bookmark button
        bookmarkBtn.addEventListener('click', () => {
            if (state.currentView === 'reading') toggleBookmark();
            else showBookmarks();
        });

        // Long-press on bookmark btn for bookmarks list (use the nav home breadcrumb area)
        // Instead, let's add a small handler: double-click = show list
        bookmarkBtn.addEventListener('dblclick', showBookmarks);

        // Font controls
        $('fontDecrease').addEventListener('click', () => changeFontSize(-0.1));
        $('fontIncrease').addEventListener('click', () => changeFontSize(0.1));

        // Mobile sidebar toggle
        sidebarToggle.addEventListener('click', () => {
            chapterSidebar.classList.toggle('open');
        });

        // Keyboard navigation
        document.addEventListener('keydown', e => {
            if (state.currentView !== 'reading') return;
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft' && state.currentChapterIdx > 0) {
                state.currentChapterIdx--;
                renderChapter();
            } else if (e.key === 'ArrowRight' && state.currentChapterIdx < SACRED_TEXTS[state.currentBook].length - 1) {
                state.currentChapterIdx++;
                renderChapter();
            }
        });

        // Back to Top button
        const backToTop = $('backToTop');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ── Start ──
    document.addEventListener('DOMContentLoaded', init);
})();

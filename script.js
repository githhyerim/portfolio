/* =========================================================================
   포트폴리오 스크립트 (Vanilla JS / 의존성 없음)
   - PLAN.md §7 인터랙션 명세 중 "기본 구조" 범위 구현
     1) 모바일 메뉴(드로어)         : 7.2 I03
     2) 헤더 스크롤 상태            : 7.2 I01
     3) 현재 섹션 표시(스크롤 스파이) : 7.2 I02
     4) 프로젝트 필터               : 7.2 I07
     5) 이메일 복사 + 토스트         : 7.2 I09
     6) 저작권 연도 표시
   - JS가 없어도 콘텐츠 열람과 메뉴 이동은 가능하도록 설계
   ========================================================================= */
(function () {
  "use strict";

  /* JS 사용 가능 상태로 전환 → CSS의 .no-js 폴백 해제 */
  document.documentElement.classList.replace("no-js", "js");

  var header = document.getElementById("site-header");
  var nav = document.getElementById("site-nav");
  var navToggle = document.getElementById("nav-toggle");

  function isDesktop() {
    return window.matchMedia("(min-width: 1024px)").matches;
  }

  /* ===== 1. 모바일 메뉴(드로어) ===== */
  function openNav() {
    if (!nav || !navToggle) return;
    nav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "메뉴 닫기");
    document.body.classList.add("nav-open");

    var firstLink = nav.querySelector(".nav__link");
    if (firstLink) firstLink.focus({ preventScroll: true });
  }

  function closeNav(restoreFocus) {
    if (!nav || !navToggle || !nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "메뉴 열기");
    document.body.classList.remove("nav-open");
    if (restoreFocus) navToggle.focus();
  }

  if (nav && navToggle) {
    navToggle.addEventListener("click", function () {
      if (nav.classList.contains("is-open")) {
        closeNav(true);
      } else {
        openNav();
      }
    });

    /* 메뉴를 선택하면 드로어를 닫고 해당 섹션으로 이동(앵커 기본 동작 유지) */
    nav.addEventListener("click", function (event) {
      if (event.target.closest(".nav__link")) closeNav(false);
    });

    /* ESC로 닫기 */
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeNav(true);
    });

    /* 드로어 바깥 클릭 시 닫기 */
    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("is-open")) return;
      if (header && header.contains(event.target)) return;
      closeNav(false);
    });

    /* 화면이 넓어지면 드로어 상태 초기화 */
    window.addEventListener("resize", function () {
      if (isDesktop()) closeNav(false);
    });
  }

  /* ===== 2. 헤더 스크롤 상태 ===== */
  if (header) {
    var headerTicking = false;

    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      headerTicking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (headerTicking) return;
        headerTicking = true;
        window.requestAnimationFrame(updateHeader);
      },
      { passive: true }
    );

    updateHeader();
  }

  /* ===== 3. 현재 섹션 표시(스크롤 스파이) ===== */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav__link"));
  var sections = navLinks
    .map(function (link) {
      return document.querySelector(link.getAttribute("href"));
    })
    .filter(function (section) {
      return section !== null;
    });

  function setActiveSection(id) {
    navLinks.forEach(function (link) {
      var isActive = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  if (sections.length) {
    if ("IntersectionObserver" in window) {
      var visibleSections = new Set();

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              visibleSections.add(entry.target.id);
            } else {
              visibleSections.delete(entry.target.id);
            }
          });

          /* 화면 중앙부에 걸친 섹션 중 문서 순서가 가장 앞선 섹션을 활성화 */
          var current = sections.filter(function (section) {
            return visibleSections.has(section.id);
          })[0];

          if (current) setActiveSection(current.id);
        },
        { rootMargin: "-45% 0px -45% 0px" }
      );

      sections.forEach(function (section) {
        observer.observe(section);
      });
    } else {
      setActiveSection(sections[0].id);
    }
  }

  /* ===== 4. 프로젝트 필터 ===== */
  var filterGroup = document.querySelector("[data-filter-group]");
  var projectList = document.querySelector("[data-project-list]");
  var emptyMessage = document.querySelector("[data-empty]");

  if (filterGroup && projectList) {
    var filterButtons = Array.prototype.slice.call(
      filterGroup.querySelectorAll("[data-filter]")
    );
    var projectItems = Array.prototype.slice.call(
      projectList.querySelectorAll("[data-category]")
    );

    var applyFilter = function (value) {
      var shownCount = 0;

      projectItems.forEach(function (item) {
        var categories = (item.getAttribute("data-category") || "").split(/\s+/);
        var matched = value === "all" || categories.indexOf(value) !== -1;
        item.hidden = !matched;
        if (matched) shownCount += 1;
      });

      filterButtons.forEach(function (button) {
        var isOn = button.getAttribute("data-filter") === value;
        button.classList.toggle("is-active", isOn);
        button.setAttribute("aria-pressed", isOn ? "true" : "false");
      });

      if (emptyMessage) emptyMessage.hidden = shownCount > 0;
    };

    filterGroup.addEventListener("click", function (event) {
      var button = event.target.closest("[data-filter]");
      if (!button) return;
      applyFilter(button.getAttribute("data-filter"));
    });

    applyFilter("all");
  }

  /* ===== 5. 이메일 복사 + 토스트 ===== */
  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2000);
  }

  /* Clipboard API 미지원/거부 시 임시 textarea로 폴백 */
  function legacyCopy(text) {
    try {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-1000px";
      document.body.appendChild(textarea);
      textarea.select();
      var succeeded = document.execCommand("copy");
      document.body.removeChild(textarea);
      return succeeded;
    } catch (error) {
      return false;
    }
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return legacyCopy(text);
        }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  document.addEventListener("click", function (event) {
    var button = event.target.closest("[data-copy-email]");
    if (!button) return;

    var email = button.getAttribute("data-copy-email");
    var originalLabel = button.textContent;

    copyToClipboard(email).then(function (succeeded) {
      if (succeeded) {
        button.textContent = "복사됨 ✓";
        showToast("이메일 주소를 복사했습니다.");
      } else {
        showToast("복사에 실패했습니다. 주소를 직접 선택해 주세요.");
      }

      window.setTimeout(function () {
        button.textContent = originalLabel;
      }, 1600);
    });
  });

  /* ===== 6. 저작권 연도 ===== */
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();

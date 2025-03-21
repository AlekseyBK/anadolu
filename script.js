document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------ HEADER ------------------------------
    const anadoluSearchButton = document.querySelector("#anadolu_search-button");
    const anadoluSearchForm = document.querySelector("#anadolu_search-form");
    const anadoluSearchField = anadoluSearchForm.querySelector(".anadolu_search-field");

    const toggleSearch = (show) => {
        anadoluSearchForm.style.visibility = show ? "visible" : "hidden";
        anadoluSearchButton.style.visibility = show ? "hidden" : "visible";
        if (show) anadoluSearchField.focus();
    };

    anadoluSearchButton.addEventListener("click", (event) => {
        toggleSearch(true);
        event.stopPropagation();
    });

    document.addEventListener("click", (event) => {
        if (!anadoluSearchForm.contains(event.target) && event.target !== anadoluSearchButton) {
            toggleSearch(false);
        }
    });

    // ------------------------------ MOBILE MENU ------------------------------
    const anadoluMobileSearchBtn = document.querySelector('.anadolu_mobile-search-btn');
    const anadoluMobileSearchContainer = document.querySelector('.anadolu_mobile-search-container');

    let isSearchVisible = false; // Флаг состояния

    const toggleMobileSearchVisible = (show) => {
        isSearchVisible = show;
        anadoluMobileSearchContainer.style.transform = show ? "translateY(-68px)" : "translateY(68px)";
    };

    // Обработчик клика на кнопку поиска
    anadoluMobileSearchBtn.addEventListener('click', (event) => {
        toggleMobileSearchVisible(!isSearchVisible); // Переключение состояния
        event.stopPropagation();
    });

    // ------------------------------ SLIDER ------------------------------
    const slidesContainer = document.querySelector(".anadolu_slides");
    const paginationContainer = document.querySelector(".anadolu_pagination");
    const prevBtn = document.querySelector(".anadolu_prev");
    const nextBtn = document.querySelector(".anadolu_next");

    let slides = [...document.querySelectorAll(".anadolu_slide")];
    let currentIndex = 1;
    let interval = null;
    let isAnimating = false;
    let startX = 0, moveX = 0;
    let isSwiping = false; // Новый флаг для отслеживания свайпа

    function initSlider() {
        if (slides.length < 2) {
            prevBtn.style.display = "none";
            nextBtn.style.display = "none";
            paginationContainer.style.display = "none";
            slidesContainer.style.width = "100%";
            makeSlideLink();
            return;
        }

        // Дублируем первый и последний слайд для эффекта бесконечного цикла
        const firstClone = slides[0].cloneNode(true);
        const lastClone = slides[slides.length - 1].cloneNode(true);
        slidesContainer.prepend(lastClone);
        slidesContainer.append(firstClone);

        slides = [...document.querySelectorAll(".anadolu_slide")];

        // Проверяем каждый слайд, если есть атрибут link, оборачиваем img в ссылку
        function makeSlideLink() {
            slides.forEach(slide => {
                const link = slide.getAttribute("data-link");
                const img = slide.querySelector("img");
    
                if (link && img) {
                    const ariaLabel = slide.getAttribute("data-aria-label");
                    const aTag = document.createElement("a");
                    aTag.href = link;
                    if (ariaLabel) {
                        aTag.setAttribute("aria-label", ariaLabel);
                    }
                    slide.insertBefore(aTag, img);
                    aTag.appendChild(img);
                    slide.style.cursor = "pointer";
                }
            });
        }
        
        makeSlideLink();

        // Устанавливаем начальную позицию
        updateSlider(true);

        // Создаем пагинацию
        paginationContainer.innerHTML = "";
        for (let i = 0; i < slides.length - 2; i++) {
            const dot = document.createElement("div");
            dot.classList.add("anadolu_dot");
            dot.dataset.index = i + 1;
            if (i === 0) dot.classList.add("anadolu_active");
            paginationContainer.appendChild(dot);
        }

        addEventListeners();
        startInterval();
    }

    function updateSlider(instant = false) {
        slidesContainer.style.transition = instant ? "none" : "transform 0.3s ease";
        slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    function updatePagination() {
        document.querySelectorAll(".anadolu_dot").forEach((dot, i) => {
            dot.classList.toggle("anadolu_active", i === (currentIndex - 1 + slides.length - 2) % (slides.length - 2));
        });
    }

    function changeSlide(newIndex) {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex = newIndex;
        updateSlider();
        updatePagination();

        setTimeout(() => {
            if (currentIndex > slides.length - 2) currentIndex = 1;
            if (currentIndex === 0) currentIndex = slides.length - 2;
            updateSlider(true);
            isAnimating = false;
        }, 300);

        resetInterval();
    }

    function addEventListeners() {
        paginationContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("anadolu_dot")) {
                changeSlide(Number(e.target.dataset.index));
            }
        });

        slidesContainer.addEventListener("mousedown", (e) => startDrag(e.clientX));
        slidesContainer.addEventListener("touchstart", (e) => startDrag(e.touches[0].clientX));

        // Обработчик клика по слайду
        slidesContainer.addEventListener("click", (e) => {
            // Если был свайп, не выполняем клик
            if (isSwiping) return;

            const slide = e.target.closest(".anadolu_slide");
            if (slide && slide.querySelector("a")) { // Проверяем, есть ли ссылка в слайде
                const link = slide.querySelector("a");
                window.location.href = link.href; // Переходим по ссылке
                e.stopImmediatePropagation(); // Останавливаем дальнейшее распространение события
            }
        });

        document.addEventListener("mousemove", (e) => onMoveDrag(e.clientX));
        document.addEventListener("touchmove", (e) => onMoveDrag(e.touches[0].clientX));
        document.addEventListener("mouseup", onEndDrag);
        document.addEventListener("touchend", onEndDrag);

        prevBtn.addEventListener("click", () => changeSlide(currentIndex - 1));
        nextBtn.addEventListener("click", () => changeSlide(currentIndex + 1));
        document.addEventListener("keydown", ({ key }) => {
            if (key === "ArrowLeft") changeSlide(currentIndex - 1);
            if (key === "ArrowRight") changeSlide(currentIndex + 1);
        });
    }

    function startDrag(x) {
        if (isAnimating) return;
        startX = x;
        moveX = 0;
        slidesContainer.style.transition = "none";
        clearInterval(interval);
        isSwiping = false; // Сбрасываем флаг свайпа
    }

    function onMoveDrag(x) {
        if (startX === 0) return;
        isSwiping = true; // Устанавливаем флаг свайпа
        moveX = x - startX;
        slidesContainer.style.transform = `translateX(${-(currentIndex * 100) + (moveX / slidesContainer.clientWidth) * 100}%)`;
    }

    function onEndDrag() {
        if (startX === 0) return;
        if (Math.abs(moveX) > slidesContainer.clientWidth / 4) {
            changeSlide(currentIndex + (moveX < 0 ? 1 : -1));
        } else {
            updateSlider();
        }
        startX = 0;
        moveX = 0;
    }

    function startInterval() {
        interval = setInterval(() => changeSlide(currentIndex + 1), 3000);
    }

    function resetInterval() {
        clearInterval(interval);
        startInterval();
    }

    initSlider();
});

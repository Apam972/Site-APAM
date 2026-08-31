document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ============================================================
        // CONFIGURATION
        // ============================================================

        const JSON_URL =
            "../data/actualites.json";


        // ============================================================
        // ÉLÉMENTS
        // ============================================================

        const newsLoading =
            document.getElementById(
                "news-loading"
            );

        const newsList =
            document.getElementById(
                "news-list"
            );

        const newsEmpty =
            document.getElementById(
                "news-empty"
            );

        const newsError =
            document.getElementById(
                "news-error"
            );

        const newsErrorMessage =
            document.getElementById(
                "news-error-message"
            );

        const retryButton =
            document.getElementById(
                "retry-button"
            );


        // ============================================================
        // MODAL
        // ============================================================

        const articleModal =
            document.getElementById(
                "article-modal"
            );

        const articleModalOverlay =
            document.getElementById(
                "article-modal-overlay"
            );

        const articleModalClose =
            document.getElementById(
                "article-modal-close"
            );

        const articleModalImage =
            document.getElementById(
                "article-modal-image"
            );

        const articleModalDate =
            document.getElementById(
                "article-modal-date"
            );

        const articleModalTitle =
            document.getElementById(
                "article-modal-title"
            );

        const articleModalText =
            document.getElementById(
                "article-modal-text"
            );

        const articleModalImages =
            document.getElementById(
                "article-modal-images"
            );


            // ============================================================
// LIGHTBOX DES IMAGES DE L'ARTICLE
// ============================================================

const articleImageLightbox =
    document.getElementById(
        "article-image-lightbox"
    );

const articleImageLightboxOverlay =
    document.getElementById(
        "article-image-lightbox-overlay"
    );

const articleImageLightboxClose =
    document.getElementById(
        "article-image-lightbox-close"
    );

const articleImageLightboxImage =
    document.getElementById(
        "article-image-lightbox-image"
    );

const articleImageLightboxPrev =
    document.getElementById(
        "article-image-lightbox-prev"
    );

const articleImageLightboxNext =
    document.getElementById(
        "article-image-lightbox-next"
    );


// Image actuellement affichée
let currentLightboxIndex = 0;

// Images de l'actualité actuellement ouverte
let currentLightboxImages = [];

        // ============================================================
        // VÉRIFICATION
        // ============================================================

        if (
            !newsLoading ||
    !newsList ||
    !newsEmpty ||
    !newsError ||
    !newsErrorMessage ||
    !retryButton ||
    !articleModal ||
    !articleModalOverlay ||
    !articleModalClose ||
    !articleModalImage ||
    !articleModalDate ||
    !articleModalTitle ||
    !articleModalText ||
    !articleModalImages ||
    !articleImageLightbox ||
    !articleImageLightboxOverlay ||
    !articleImageLightboxClose ||
    !articleImageLightboxImage ||
    !articleImageLightboxPrev ||
    !articleImageLightboxNext
        ) {

            console.error(
                "Actualités : éléments HTML manquants."
            );

            return;
        }


        // ============================================================
        // DONNÉES
        // ============================================================

        let actualites = [];


        // ============================================================
        // UTILITAIRES
        // ============================================================

        function formatDate(
            dateString
        ) {

            if (!dateString) {
                return "";
            }


            const date =
                new Date(
                    `${dateString}T00:00:00`
                );


            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {

                return dateString;
            }


            return new Intl.DateTimeFormat(
                "fr-FR",
                {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            ).format(
                date
            );
        }


        function getPreviewText(
            content,
            maxLength = 160
        ) {

            const text =
                String(
                    content || ""
                )
                .replace(
                    /\s+/g,
                    " "
                )
                .trim();


            if (!text) {
                return "";
            }


            if (
                text.length <= maxLength
            ) {

                return text;
            }


            return (
                text
                    .slice(
                        0,
                        maxLength
                    )
                    .trimEnd()
                + "..."
            );
        }


        /*
         * Les chemins présents dans actualites.json
         * sont relatifs à la racine du site.
         *
         * La page actuelle est :
         *
         * /actualites/actualites.html
         *
         * donc il faut remonter d'un niveau.
         */

        function resolveSitePath(
            filePath
        ) {

            if (!filePath) {
                return "";
            }


            if (
                /^https?:\/\//i.test(
                    filePath
                )
            ) {

                return filePath;
            }


            if (
                filePath.startsWith(
                    "/"
                )
            ) {

                return filePath;
            }


            return `../${filePath}`;
        }


        // ============================================================
        // ÉTATS
        // ============================================================

        function showLoading() {

            newsLoading.classList.remove(
                "hidden"
            );

            newsList.classList.add(
                "hidden"
            );

            newsEmpty.classList.add(
                "hidden"
            );

            newsError.classList.add(
                "hidden"
            );
        }


        function showNews() {

            newsLoading.classList.add(
                "hidden"
            );

            newsList.classList.remove(
                "hidden"
            );

            newsEmpty.classList.add(
                "hidden"
            );

            newsError.classList.add(
                "hidden"
            );
        }


        function showEmpty() {

            newsLoading.classList.add(
                "hidden"
            );

            newsList.classList.add(
                "hidden"
            );

            newsEmpty.classList.remove(
                "hidden"
            );

            newsError.classList.add(
                "hidden"
            );
        }


        function showError(
            message
        ) {

            newsLoading.classList.add(
                "hidden"
            );

            newsList.classList.add(
                "hidden"
            );

            newsEmpty.classList.add(
                "hidden"
            );

            newsError.classList.remove(
                "hidden"
            );

            newsErrorMessage.textContent =
                message ||
                "Une erreur est survenue.";
        }


        // ============================================================
        // CRÉATION D'UNE CARTE
        // ============================================================

        function createNewsCard(
            news,
            index
        ) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "news-card";


            card.dataset.index =
                String(
                    index
                );


            card.tabIndex =
                0;


            card.setAttribute(
                "role",
                "button"
            );


            card.setAttribute(
                "aria-label",
                `Lire l'actualité : ${
                    news.title || ""
                }`
            );


            // --------------------------------------------------------
            // IMAGE
            // --------------------------------------------------------

            const imageWrapper =
                document.createElement(
                    "div"
                );


            imageWrapper.className =
                "news-card-image";


            if (news.cover) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    resolveSitePath(
                        news.cover
                    );


                image.alt =
                    news.title ||
                    "Actualité APAM";


                image.loading =
                    "lazy";


                imageWrapper.appendChild(
                    image
                );
            }


            // --------------------------------------------------------
            // CONTENU
            // --------------------------------------------------------

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "news-card-content";


            const date =
                document.createElement(
                    "p"
                );


            date.className =
                "news-card-date";


            date.textContent =
                formatDate(
                    news.date
                );


            const title =
                document.createElement(
                    "h2"
                );


            title.className =
                "news-card-title";


            title.textContent =
                news.title ||
                "Actualité";


            const description =
                document.createElement(
                    "p"
                );


            description.className =
                "news-card-description";


            description.textContent =
                getPreviewText(
                    news.content
                );


            const read =
                document.createElement(
                    "span"
                );


            read.className =
                "news-card-read";


            read.innerHTML = `
                Lire l'article
                <span
                    class="news-card-read-arrow"
                    aria-hidden="true"
                >
                    →
                </span>
            `;


            content.appendChild(
                date
            );

            content.appendChild(
                title
            );

            content.appendChild(
                description
            );

            content.appendChild(
                read
            );


            card.appendChild(
                imageWrapper
            );

            card.appendChild(
                content
            );


            return card;
        }


        // ============================================================
        // AFFICHAGE
        // ============================================================

        function renderActualites() {

            newsList.innerHTML =
                "";


            if (
                actualites.length === 0
            ) {

                showEmpty();

                return;
            }


            /*
             * Plus récente → plus ancienne
             */

            const sorted =
                actualites
                    .map(
                        (
                            news,
                            index
                        ) => ({
                            news,
                            index
                        })
                    )
                    .sort(
                        (a, b) => {

                            return (
                                String(
                                    b.news.date || ""
                                ).localeCompare(
                                    String(
                                        a.news.date || ""
                                    )
                                )
                            );
                        }
                    );


            sorted.forEach(
                ({
                    news,
                    index
                }) => {

                    newsList.appendChild(
                        createNewsCard(
                            news,
                            index
                        )
                    );
                }
            );


            showNews();
        }


        // ============================================================
        // OUVRIR UNE ACTUALITÉ
        // ============================================================

        function openArticleModal(
            news
        ) {

            if (!news) {
                return;
            }


            console.log(
                "Ouverture de l'actualité :",
                news.title
            );


            // --------------------------------------------------------
            // IMAGE DE COUVERTURE
            // --------------------------------------------------------

            if (news.cover) {

                articleModalImage.style
                    .backgroundImage =
                    `url("${resolveSitePath(
                        news.cover
                    )}")`;

            } else {

                articleModalImage.style
                    .backgroundImage =
                    "none";
            }


            // --------------------------------------------------------
            // DATE
            // --------------------------------------------------------

            articleModalDate.textContent =
                formatDate(
                    news.date
                );


            // --------------------------------------------------------
            // TITRE
            // --------------------------------------------------------

            articleModalTitle.textContent =
                news.title ||
                "Actualité";


            // --------------------------------------------------------
            // TEXTE
            // --------------------------------------------------------

            articleModalText.innerHTML =
                "";


            const paragraphs =
                String(
                    news.content || ""
                )
                .split(
                    /\r?\n/
                );


            paragraphs.forEach(
                (paragraph) => {

                    const text =
                        paragraph.trim();


                    if (!text) {
                        return;
                    }


                    const p =
                        document.createElement(
                            "p"
                        );


                    p.textContent =
                        text;


                    articleModalText.appendChild(
                        p
                    );
                }
            );


            // --------------------------------------------------------
            // IMAGES SUPPLÉMENTAIRES
            // --------------------------------------------------------

            articleModalImages.innerHTML =
                "";


            if (
                Array.isArray(
                    news.images
                )
                &&
                news.images.length > 0
            ) {

                news.images.forEach(
                    (
                        imagePath,
                        index
                    ) => {

                        if (!imagePath) {
                            return;
                        }


                        const image =
                            document.createElement(
                                "img"
                            );


                        image.src =
                            resolveSitePath(
                                imagePath
                            );


                        image.alt =
                            `${news.title || "Actualité APAM"} — image ${
                                index + 1
                            }`;


                        image.loading =
                            "lazy";


                        image.className =
                            "article-modal-gallery-image";

                         image.dataset.imagePath =
                            imagePath;

                        articleModalImages.appendChild(
                            image
                        );
                    }
                );
            }


            // --------------------------------------------------------
            // PRÉPARATION DU MODAL
            // --------------------------------------------------------

            articleModal.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.classList.add(
                "modal-open"
            );


            /*
             * On s'assure que le modal est dans son état initial
             * avant de lancer la transition.
             */

            articleModal.classList.remove(
                "is-open"
            );


            const modalContent =
                articleModal.querySelector(
                    ".article-modal-content"
                );


            if (modalContent) {

                modalContent.scrollTop =
                    0;
            }


            /*
             * Double requestAnimationFrame :
             *
             * 1. Le navigateur peint l'état initial.
             * 2. Ensuite seulement on ajoute "is-open".
             *
             * Cela force l'animation CSS à être visible.
             */

            requestAnimationFrame(
                () => {

                    requestAnimationFrame(
                        () => {

                            articleModal.classList.add(
                                "is-open"
                            );

                        }
                    );

                }
            );


            // --------------------------------------------------------
            // FOCUS
            // --------------------------------------------------------

            window.setTimeout(
                () => {

                    articleModalClose.focus();

                },
                100
            );
        }


        // ============================================================
        // FERMER UNE ACTUALITÉ
        // ============================================================

        function closeArticleModal() {

            articleModal.classList.remove(
                "is-open"
            );


            articleModal.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.classList.remove(
                "modal-open"
            );


            /*
             * On laisse l'animation de fermeture se terminer
             * avant de vider le contenu.
             */

            window.setTimeout(
                () => {

                    if (
                        !articleModal.classList.contains(
                            "is-open"
                        )
                    ) {

                        articleModalImage.style
                            .backgroundImage =
                            "none";

                        articleModalDate.textContent =
                            "";

                        articleModalTitle.textContent =
                            "";

                        articleModalText.innerHTML =
                            "";

                        articleModalImages.innerHTML =
                            "";
                    }

                },
                450
            );
        }


        // ============================================================
// LIGHTBOX — AFFICHER UNE IMAGE
// ============================================================

function showLightboxImage(index) {

    if (
        currentLightboxImages.length === 0
    ) {
        return;
    }


    // Boucle automatiquement
    if (
        index < 0
    ) {
        index =
            currentLightboxImages.length - 1;
    }


    if (
        index >=
        currentLightboxImages.length
    ) {
        index = 0;
    }


    currentLightboxIndex =
        index;


    const imagePath =
        currentLightboxImages[
            currentLightboxIndex
        ];


    articleImageLightboxImage.src =
        resolveSitePath(
            imagePath
        );


    articleImageLightboxImage.alt =
        `Image ${currentLightboxIndex + 1}`;


    // Afficher / cacher les flèches
    const hasMultipleImages =
        currentLightboxImages.length > 1;


    articleImageLightboxPrev.style.display =
        hasMultipleImages
            ? "flex"
            : "none";


    articleImageLightboxNext.style.display =
        hasMultipleImages
            ? "flex"
            : "none";
}


// ============================================================
// LIGHTBOX — OUVRIR
// ============================================================

function openImageLightbox(
    images,
    index
) {

    if (
        !Array.isArray(images)
        ||
        images.length === 0
    ) {
        return;
    }


    currentLightboxImages =
        images.filter(
            image =>
                Boolean(image)
        );


    currentLightboxIndex =
        index;


    showLightboxImage(
        currentLightboxIndex
    );


    articleImageLightbox.setAttribute(
        "aria-hidden",
        "false"
    );


    articleImageLightbox.classList.add(
        "is-open"
    );
}


// ============================================================
// LIGHTBOX — FERMER
// ============================================================

function closeImageLightbox() {

    articleImageLightbox.classList.remove(
        "is-open"
    );


    articleImageLightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    window.setTimeout(
        () => {

            if (
                !articleImageLightbox.classList.contains(
                    "is-open"
                )
            ) {

                articleImageLightboxImage.src =
                    "";

                articleImageLightboxImage.alt =
                    "";

                currentLightboxImages =
                    [];

                currentLightboxIndex =
                    0;
            }

        },
        300
    );
}


// ============================================================
// LIGHTBOX — NAVIGATION
// ============================================================

function showPreviousLightboxImage() {

    showLightboxImage(
        currentLightboxIndex - 1
    );
}


function showNextLightboxImage() {

    showLightboxImage(
        currentLightboxIndex + 1
    );
}


// ============================================================
// CLIC SUR LES IMAGES DE LA GALERIE
// ============================================================

articleModalImages.addEventListener(
    "click",
    (event) => {

        const image =
            event.target.closest(
                ".article-modal-gallery-image"
            );


        if (!image) {
            return;
        }


        const images =
            Array.from(
                articleModalImages.querySelectorAll(
                    ".article-modal-gallery-image"
                )
            )
            .map(
                imageElement =>
                    imageElement.dataset.imagePath
            );


        const index =
            Array.from(
                articleModalImages.querySelectorAll(
                    ".article-modal-gallery-image"
                )
            )
            .indexOf(
                image
            );


        openImageLightbox(
            images,
            index
        );
    }
);


// ============================================================
// BOUTONS LIGHTBOX
// ============================================================

articleImageLightboxClose.addEventListener(
    "click",
    closeImageLightbox
);


articleImageLightboxOverlay.addEventListener(
    "click",
    closeImageLightbox
);


articleImageLightboxPrev.addEventListener(
    "click",
    showPreviousLightboxImage
);


articleImageLightboxNext.addEventListener(
    "click",
    showNextLightboxImage
);


// ============================================================
// CLAVIER LIGHTBOX
// ============================================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            !articleImageLightbox.classList.contains(
                "is-open"
            )
        ) {
            return;
        }


        if (
            event.key === "Escape"
        ) {

            closeImageLightbox();

            return;
        }


        if (
            event.key === "ArrowLeft"
        ) {

            showPreviousLightboxImage();

            return;
        }


        if (
            event.key === "ArrowRight"
        ) {

            showNextLightboxImage();
        }
    }
);

        // ============================================================
        // CLIC SUR LES CARTES
        // ============================================================

        /*
         * Délégation d'événement :
         * on écoute le conteneur plutôt que chaque carte.
         */

        newsList.addEventListener(
            "click",
            (event) => {

                const card =
                    event.target.closest(
                        ".news-card"
                    );


                if (!card) {
                    return;
                }


                const index =
                    Number(
                        card.dataset.index
                    );


                if (
                    Number.isNaN(
                        index
                    )
                ) {

                    return;
                }


                openArticleModal(
                    actualites[index]
                );
            }
        );


        // ============================================================
        // CLAVIER
        // ============================================================

        newsList.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key !== "Enter"
                    &&
                    event.key !== " "
                ) {

                    return;
                }


                const card =
                    event.target.closest(
                        ".news-card"
                    );


                if (!card) {
                    return;
                }


                event.preventDefault();


                const index =
                    Number(
                        card.dataset.index
                    );


                if (
                    Number.isNaN(
                        index
                    )
                ) {

                    return;
                }


                openArticleModal(
                    actualites[index]
                );
            }
        );


        // ============================================================
        // FERMETURE
        // ============================================================

        articleModalClose.addEventListener(
            "click",
            closeArticleModal
        );


        articleModalOverlay.addEventListener(
            "click",
            closeArticleModal
        );


        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Escape"
                    &&
                    articleModal.classList.contains(
                        "is-open"
                    )
                ) {

                    closeArticleModal();
                }
            }
        );


        // ============================================================
        // CHARGEMENT JSON
        // ============================================================

        async function loadActualites() {

            showLoading();


            try {

                console.log(
                    "Chargement des actualités..."
                );


                const response =
                    await fetch(
                        `${JSON_URL}?ts=${Date.now()}`,
                        {
                            cache:
                                "no-store"
                        }
                    );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        `Erreur HTTP ${response.status}`
                    );
                }


                const data =
                    await response.json();


                if (
                    !Array.isArray(
                        data
                    )
                ) {

                    throw new Error(
                        "actualites.json ne contient pas une liste."
                    );
                }


                actualites =
                    data;


                console.log(
                    "Réponse actualites.json :",
                    response.status
                );


                console.log(
                    `${actualites.length} actualité(s) chargée(s).`
                );


                renderActualites();


            } catch (error) {

                console.error(
                    "Impossible de charger les actualités :",
                    error
                );


                showError(
                    error.message
                );
            }
        }


        // ============================================================
        // BOUTON RETRY
        // ============================================================

        retryButton.addEventListener(
            "click",
            loadActualites
        );


        // ============================================================
        // INITIALISATION
        // ============================================================

        loadActualites();

    }
);
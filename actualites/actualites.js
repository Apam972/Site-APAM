document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ============================================================
        // CONFIGURATION
        // ============================================================

        const JSON_URL =
            "../data/actualites.json";


        // ============================================================
        // ÉLÉMENTS PRINCIPAUX
        // ============================================================

        const newsList =
            document.getElementById(
                "news-list"
            );

        const loading =
            document.getElementById(
                "news-loading"
            );

        const empty =
            document.getElementById(
                "news-empty"
            );

        const error =
            document.getElementById(
                "news-error"
            );

        const errorMessage =
            document.getElementById(
                "news-error-message"
            );

        const retryButton =
            document.getElementById(
                "retry-button"
            );


        // ============================================================
        // ÉLÉMENTS POPUP
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


        // ============================================================
        // VÉRIFICATION DE L'INTERFACE
        // ============================================================

        if (
            !newsList ||
            !loading ||
            !empty ||
            !error ||
            !errorMessage
        ) {

            console.error(
                "Interface Actualités introuvable."
            );

            return;
        }


        // ============================================================
        // UTILITAIRES
        // ============================================================

        function escapeHtml(
            value
        ) {

            const element =
                document.createElement(
                    "div"
                );


            element.textContent =
                value ?? "";


            return element.innerHTML;
        }


        function formatDate(
            dateString
        ) {

            if (
                !dateString
            ) {

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
                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric"
                }
            ).format(
                date
            );
        }


        function getPreviewText(
            content
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


            if (
                !text
            ) {

                return "";
            }


            const maxLength =
                160;


            if (
                text.length >
                maxLength
            ) {

                return (
                    text
                        .slice(
                            0,
                            maxLength
                        )
                        .trim()
                    + "..."
                );
            }


            return text;
        }


        function convertArticleTextToHtml(
            content
        ) {

            const text =
                String(
                    content || ""
                );


            if (
                !text.trim()
            ) {

                return `
                    <p>
                        Aucun contenu disponible.
                    </p>
                `;
            }


            /*
             * On considère chaque ligne non vide
             * comme un paragraphe.
             */

            return text
                .split(/\r?\n+/)
                .map(
                    paragraph => {

                        const clean =
                            paragraph.trim();


                        if (
                            !clean
                        ) {

                            return "";
                        }


                        return `
                            <p>
                                ${escapeHtml(
                                    clean
                                )}
                            </p>
                        `;
                    }
                )
                .join("");
        }


        // ============================================================
        // GESTION DES ÉTATS
        // ============================================================

        function hideAllStates() {

            loading.classList.add(
                "hidden"
            );

            empty.classList.add(
                "hidden"
            );

            error.classList.add(
                "hidden"
            );
        }


        function showLoading() {

            hideAllStates();

            newsList.classList.add(
                "hidden"
            );

            loading.classList.remove(
                "hidden"
            );
        }


        function showEmpty() {

            hideAllStates();

            newsList.classList.add(
                "hidden"
            );

            empty.classList.remove(
                "hidden"
            );
        }


        function showError(
            message
        ) {

            hideAllStates();

            newsList.classList.add(
                "hidden"
            );

            error.classList.remove(
                "hidden"
            );

            errorMessage.textContent =
                message ||
                "Une erreur est survenue.";
        }


        function showNewsList() {

            hideAllStates();

            newsList.classList.remove(
                "hidden"
            );
        }


        // ============================================================
        // POPUP : OUVERTURE
        // ============================================================

        function openArticleModal(
            article
        ) {

            if (
                !articleModal
            ) {

                console.error(
                    "Popup article introuvable."
                );

                return;
            }


            // --------------------------------------------------------
            // DATE
            // --------------------------------------------------------

            if (
                articleModalDate
            ) {

                articleModalDate.textContent =
                    formatDate(
                        article.date
                    );
            }


            // --------------------------------------------------------
            // TITRE
            // --------------------------------------------------------

            if (
                articleModalTitle
            ) {

                articleModalTitle.textContent =
                    article.title ||
                    "Actualité APAM";
            }


            // --------------------------------------------------------
            // IMAGE
            // --------------------------------------------------------

            if (
                articleModalImage
            ) {

                articleModalImage.innerHTML =
                    "";


                if (
                    article.cover
                ) {

                    const image =
                        document.createElement(
                            "img"
                        );


                    /*
                     * article.cover est enregistré
                     * depuis la racine du site.
                     *
                     * Exemple :
                     * assets/actu/test/image/cover.jpg
                     */

                    image.src =
                        `../${article.cover}`;


                    image.alt =
                        article.title ||
                        "Image de l'actualité";


                    image.loading =
                        "lazy";


                    image.addEventListener(
                        "error",
                        () => {

                            articleModalImage.innerHTML =
                                "";
                        }
                    );


                    articleModalImage.appendChild(
                        image
                    );
                }
            }


            // --------------------------------------------------------
            // CONTENU COMPLET
            // --------------------------------------------------------

            if (
                articleModalText
            ) {

                articleModalText.innerHTML =
                    convertArticleTextToHtml(
                        article.content
                    );
            }


            // --------------------------------------------------------
            // OUVERTURE
            // --------------------------------------------------------

            articleModal.classList.add(
                "active"
            );


            articleModal.setAttribute(
                "aria-hidden",
                "false"
            );


            document.body.style.overflow =
                "hidden";
        }


        // ============================================================
        // POPUP : FERMETURE
        // ============================================================

        function closeArticleModal() {

            if (
                !articleModal
            ) {

                return;
            }


            articleModal.classList.remove(
                "active"
            );


            articleModal.setAttribute(
                "aria-hidden",
                "true"
            );


            document.body.style.overflow =
                "";
        }


        // ============================================================
        // ÉVÉNEMENTS POPUP
        // ============================================================

        if (
            articleModalClose
        ) {

            articleModalClose.addEventListener(
                "click",
                closeArticleModal
            );
        }


        if (
            articleModalOverlay
        ) {

            articleModalOverlay.addEventListener(
                "click",
                closeArticleModal
            );
        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeArticleModal();
                }
            }
        );


        // ============================================================
        // CRÉATION D'UNE CARTE
        // ============================================================

        function createNewsCard(
            article
        ) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "news-card";


            card.setAttribute(
                "tabindex",
                "0"
            );


            // --------------------------------------------------------
            // LIEN / ZONE CLIQUABLE
            // --------------------------------------------------------

            const cardLink =
                document.createElement(
                    "div"
                );


            cardLink.className =
                "news-card-link";


            card.appendChild(
                cardLink
            );


            // --------------------------------------------------------
            // IMAGE
            // --------------------------------------------------------

            const imageContainer =
                document.createElement(
                    "div"
                );


            imageContainer.className =
                "news-card-image";


            if (
                article.cover
            ) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    `../${article.cover}`;


                image.alt =
                    article.title ||
                    "Image de l'actualité";


                image.loading =
                    "lazy";


                image.addEventListener(
                    "error",
                    () => {

                        imageContainer.innerHTML =
                            "";
                    }
                );


                imageContainer.appendChild(
                    image
                );
            }


            cardLink.appendChild(
                imageContainer
            );


            // --------------------------------------------------------
            // CONTENU
            // --------------------------------------------------------

            const content =
                document.createElement(
                    "div"
                );


            content.className =
                "news-card-content";


            // Date

            const date =
                document.createElement(
                    "p"
                );


            date.className =
                "news-card-date";


            date.textContent =
                formatDate(
                    article.date
                );


            content.appendChild(
                date
            );


            // Titre

            const title =
                document.createElement(
                    "h2"
                );


            title.textContent =
                article.title ||
                "Actualité APAM";


            content.appendChild(
                title
            );


            // Extrait

            const description =
                document.createElement(
                    "p"
                );


            description.className =
                "news-card-description";


            description.textContent =
                getPreviewText(
                    article.content
                );


            content.appendChild(
                description
            );


            // Texte "Lire l'article"

            const readMore =
                document.createElement(
                    "span"
                );


            readMore.className =
                "news-card-read";


            readMore.textContent =
                "Lire l'article →";


            content.appendChild(
                readMore
            );


            cardLink.appendChild(
                content
            );


            // --------------------------------------------------------
            // CLIC
            // --------------------------------------------------------

            card.addEventListener(
                "click",
                () => {

                    openArticleModal(
                        article
                    );
                }
            );


            // --------------------------------------------------------
            // CLAVIER
            // --------------------------------------------------------

            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        "Enter" ||
                        event.key ===
                        " "
                    ) {

                        event.preventDefault();

                        openArticleModal(
                            article
                        );
                    }
                }
            );


            return card;
        }


        // ============================================================
        // AFFICHAGE DES ACTUALITÉS
        // ============================================================

        function renderNews(
            news
        ) {

            newsList.innerHTML =
                "";


            // --------------------------------------------------------
            // AUCUNE ACTUALITÉ
            // --------------------------------------------------------

            if (
                news.length === 0
            ) {

                showEmpty();

                return;
            }


            // --------------------------------------------------------
            // TRI PAR DATE
            // --------------------------------------------------------

            const sortedNews =
                [...news].sort(
                    (
                        first,
                        second
                    ) => {

                        return (
                            String(
                                second.date || ""
                            ).localeCompare(
                                String(
                                    first.date || ""
                                )
                            )
                        );
                    }
                );


            // --------------------------------------------------------
            // CRÉATION DES CARTES
            // --------------------------------------------------------

            sortedNews.forEach(
                article => {

                    const card =
                        createNewsCard(
                            article
                        );


                    newsList.appendChild(
                        card
                    );
                }
            );


            // --------------------------------------------------------
            // VÉRIFICATION
            // --------------------------------------------------------

            if (
                newsList.children.length === 0
            ) {

                showEmpty();

                return;
            }


            showNewsList();
        }


        // ============================================================
        // CHARGEMENT DU JSON
        // ============================================================

        async function loadNews() {

            console.log(
                "Chargement des actualités..."
            );


            showLoading();


            try {

                const response =
                    await fetch(
                        `${JSON_URL}?ts=${Date.now()}`,
                        {
                            cache:
                                "no-store"
                        }
                    );


                console.log(
                    "Réponse actualites.json :",
                    response.status
                );


                if (
                    !response.ok
                ) {

                    throw new Error(
                        `Erreur HTTP ${response.status}`
                    );
                }


                const news =
                    await response.json();


                console.log(
                    `${Array.isArray(news) ? news.length : 0} actualité(s) chargée(s).`
                );


                // ----------------------------------------------------
                // VALIDATION
                // ----------------------------------------------------

                if (
                    !Array.isArray(news)
                ) {

                    throw new Error(
                        "actualites.json ne contient pas un tableau JSON valide."
                    );
                }


                renderNews(
                    news
                );


            } catch (
                loadError
            ) {

                console.error(
                    "Impossible de charger les actualités :",
                    loadError
                );


                showError(
                    loadError.message
                );
            }
        }


        // ============================================================
        // BOUTON RÉESSAYER
        // ============================================================

        if (
            retryButton
        ) {

            retryButton.addEventListener(
                "click",
                () => {

                    loadNews();
                }
            );
        }


        // ============================================================
        // INITIALISATION
        // ============================================================

        loadNews();

    }
);
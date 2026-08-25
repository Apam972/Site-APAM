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
                value || "";


            return element.innerHTML;
        }


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


        function getExcerpt(
            content,
            maxLength = 150
        ) {

            const text =
                (content || "")
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim();


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
                    .trim()
                + "..."
            );
        }


        // ============================================================
        // CHARGEMENT
        // ============================================================

        async function loadNews() {

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


                if (!response.ok) {

                    throw new Error(
                        `Erreur HTTP ${response.status}`
                    );
                }


                const news =
                    await response.json();


                if (
                    !Array.isArray(news)
                ) {

                    throw new Error(
                        "actualites.json n'est pas valide."
                    );
                }


                renderNews(
                    news
                );


            } catch (loadError) {

                showError(
                    loadError.message
                );
            }
        }


        // ============================================================
        // AFFICHAGE
        // ============================================================

        function renderNews(
            news
        ) {

            hideAllStates();


            if (
                news.length === 0
            ) {

                empty.classList.remove(
                    "hidden"
                );

                return;
            }


            const sortedNews =
                [...news].sort(
                    (
                        first,
                        second
                    ) => {

                        return (
                            (
                                second.date || ""
                            )
                                .localeCompare(
                                    first.date || ""
                                )
                        );
                    }
                );


            newsList.innerHTML =
                "";


            sortedNews.forEach(
                (article) => {

                    const slug =
                        article.slug ||
                        article.id;


                    if (!slug) {
                        return;
                    }


                    const title =
                        article.title ||
                        "Actualité APAM";


                    const cover =
                        article.cover ||
                        "";


                    const card =
                        document.createElement(
                            "article"
                        );


                    card.className =
                        "news-card";


                    card.innerHTML = `

                        <a
                            href="./pages/${encodeURIComponent(slug)}.html"
                            class="news-card-link"
                        >

                            <div
                                class="news-card-image"
                            >

                                ${
                                    cover
                                        ? `
                                            <img
                                                src="../${escapeHtml(cover)}"
                                                alt="${escapeHtml(title)}"
                                                loading="lazy"
                                            >
                                          `
                                        : ""
                                }

                            </div>


                            <div
                                class="news-card-content"
                            >

                                <p
                                    class="news-card-date"
                                >
                                    ${escapeHtml(
                                        formatDate(
                                            article.date
                                        )
                                    )}
                                </p>


                                <h2>
                                    ${escapeHtml(
                                        title
                                    )}
                                </h2>


                                <p
                                    class="news-card-description"
                                >
                                    ${escapeHtml(
                                        getExcerpt(
                                            article.content
                                        )
                                    )}
                                </p>


                                <span
                                    class="news-card-read"
                                >
                                    Lire l'article →
                                </span>

                            </div>

                        </a>

                    `;


                    newsList.appendChild(
                        card
                    );
                }
            );


            if (
                newsList.children.length === 0
            ) {

                empty.classList.remove(
                    "hidden"
                );

                return;
            }


            newsList.classList.remove(
                "hidden"
            );
        }


        // ============================================================
        // ÉTATS
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

            newsList.classList.add(
                "hidden"
            );
        }


        function showLoading() {

            hideAllStates();

            loading.classList.remove(
                "hidden"
            );
        }


        function showError(
            message
        ) {

            hideAllStates();

            error.classList.remove(
                "hidden"
            );

            errorMessage.textContent =
                message;
        }


        // ============================================================
        // RETRY
        // ============================================================

        retryButton.addEventListener(
            "click",
            () => {

                loadNews();
            }
        );


        // ============================================================
        // INITIALISATION
        // ============================================================

        loadNews();

    }
);
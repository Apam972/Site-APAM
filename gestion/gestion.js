document.addEventListener(
    "DOMContentLoaded",
    () => {

        // ====================================================
        // NAVIGATION DES ONGLETS
        // ====================================================

        const tabs =
            document.querySelectorAll(
                ".gestion-tab"
            );

        const tabContents =
            document.querySelectorAll(
                ".gestion-tab-content"
            );


        function activateTab(
            selectedTab
        ) {

            const target =
                selectedTab.getAttribute(
                    "data-tab"
                );

            if (!target) {
                return;
            }


            // ------------------------------------------------
            // ONGLET ACTIF
            // ------------------------------------------------

            tabs.forEach(
                (tab) => {

                    tab.classList.toggle(
                        "active",
                        tab === selectedTab
                    );

                }
            );


            // ------------------------------------------------
            // CONTENU ACTIF
            // ------------------------------------------------

            tabContents.forEach(
                (content) => {

                    const isTarget =
                        content.getAttribute(
                            "data-content"
                        ) === target;


                    content.classList.toggle(
                        "active",
                        isTarget
                    );

                }
            );
        }


        tabs.forEach(
            (tab) => {

                tab.addEventListener(
                    "click",
                    (event) => {

                        event.preventDefault();

                        activateTab(
                            tab
                        );

                    }
                );

            }
        );


        // ====================================================
        // ÉLÉMENTS DU FORMULAIRE ACTUALITÉS
        // ====================================================

        const form =
            document.getElementById(
                "news-form"
            );


        const titleInput =
            document.getElementById(
                "news-title"
            );


        const dateInput =
            document.getElementById(
                "news-date"
            );


        const contentInput =
            document.getElementById(
                "news-content"
            );


        const coverInput =
            document.getElementById(
                "news-cover"
            );


        const imagesInput =
            document.getElementById(
                "news-images"
            );


        const coverFileName =
            document.getElementById(
                "cover-file-name"
            );


        const imagesFileCount =
            document.getElementById(
                "images-file-count"
            );


        const coverPreview =
            document.getElementById(
                "cover-preview"
            );


        const imagesPreview =
            document.getElementById(
                "images-preview"
            );


        const previewImage =
            document.getElementById(
                "news-preview-image"
            );


        const previewTitle =
            document.getElementById(
                "news-preview-title"
            );


        const previewDate =
            document.getElementById(
                "news-preview-date"
            );


        const previewText =
            document.getElementById(
                "news-preview-text"
            );


        const cancelButton =
            document.getElementById(
                "cancel-button"
            );


        // ====================================================
        // SÉCURITÉ
        // ====================================================

        if (
            !form ||
            !titleInput ||
            !dateInput ||
            !contentInput ||
            !coverInput ||
            !imagesInput ||
            !coverFileName ||
            !imagesFileCount ||
            !coverPreview ||
            !imagesPreview ||
            !previewImage ||
            !previewTitle ||
            !previewDate ||
            !previewText ||
            !cancelButton
        ) {
            console.error(
                "Impossible d'initialiser "
                + "le formulaire de gestion APAM."
            );

            return;
        }


        // ====================================================
        // DATE PAR DÉFAUT
        // ====================================================

        const today =
            new Date();


        const year =
            today.getFullYear();


        const month =
            String(
                today.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                today.getDate()
            ).padStart(
                2,
                "0"
            );


        dateInput.value =
            `${year}-${month}-${day}`;


        previewDate.textContent =
            formatDate(
                dateInput.value
            );


        // ====================================================
        // FORMAT DATE
        // ====================================================

        function formatDate(
            dateString
        ) {

            if (!dateString) {
                return "Date de l'actualité";
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


        // ====================================================
        // IMAGE PRINCIPALE
        // ====================================================

        coverInput.addEventListener(
            "change",
            () => {

                const file =
                    coverInput.files[0];


                if (!file) {

                    coverFileName.textContent =
                        "Aucun fichier sélectionné";


                    coverPreview.innerHTML =
                        "";


                    coverPreview.classList.remove(
                        "active"
                    );


                    previewImage.style
                        .backgroundImage =
                        "";


                    previewImage.classList.remove(
                        "has-image"
                    );


                    previewImage.textContent =
                        "Image principale";


                    return;
                }


                coverFileName.textContent =
                    file.name;


                const reader =
                    new FileReader();


                reader.onload =
                    (event) => {

                        const image =
                            document.createElement(
                                "img"
                            );


                        image.src =
                            event.target.result;


                        image.alt =
                            file.name;


                        coverPreview.innerHTML =
                            "";


                        coverPreview.appendChild(
                            image
                        );


                        coverPreview.classList.add(
                            "active"
                        );


                        previewImage.style
                            .backgroundImage =
                            `url("${event.target.result}")`;


                        previewImage.classList.add(
                            "has-image"
                        );


                        previewImage.textContent =
                            "";
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );


        // ====================================================
        // PHOTOS DE LA GALERIE
        // ====================================================

        imagesInput.addEventListener(
            "change",
            () => {

                const files =
                    Array.from(
                        imagesInput.files
                    );


                if (
                    files.length === 0
                ) {

                    imagesFileCount.textContent =
                        "Aucune photo sélectionnée";


                    imagesPreview.innerHTML =
                        "";


                    return;
                }


                imagesFileCount.textContent =
                    `${files.length} photo(s) sélectionnée(s)`;


                imagesPreview.innerHTML =
                    "";


                files.forEach(
                    (file) => {

                        const reader =
                            new FileReader();


                        reader.onload =
                            (event) => {

                                const wrapper =
                                    document.createElement(
                                        "div"
                                    );


                                wrapper.className =
                                    "preview-thumbnail";


                                const image =
                                    document.createElement(
                                        "img"
                                    );


                                image.src =
                                    event.target.result;


                                image.alt =
                                    file.name;


                                wrapper.appendChild(
                                    image
                                );


                                imagesPreview.appendChild(
                                    wrapper
                                );
                            };


                        reader.readAsDataURL(
                            file
                        );

                    }
                );
            }
        );


        // ====================================================
        // APERÇU DU TITRE
        // ====================================================

        titleInput.addEventListener(
            "input",
            () => {

                previewTitle.textContent =
                    titleInput.value.trim()
                    ||
                    "Titre de l'actualité";
            }
        );


        // ====================================================
        // APERÇU DE LA DATE
        // ====================================================

        dateInput.addEventListener(
            "change",
            () => {

                previewDate.textContent =
                    formatDate(
                        dateInput.value
                    );
            }
        );


        // ====================================================
        // APERÇU DE L'ARTICLE
        // ====================================================

        contentInput.addEventListener(
            "input",
            () => {

                const text =
                    contentInput.value.trim();


                if (!text) {

                    previewText.textContent =
                        "Le début de ton article apparaîtra ici...";

                    return;
                }


                const maxLength =
                    140;


                previewText.textContent =
                    text.length > maxLength
                        ? `${text.slice(
                              0,
                              maxLength
                          )}...`
                        : text;
            }
        );


        // ====================================================
        // ANNULATION
        // ====================================================

        cancelButton.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        "Effacer les informations saisies ?"
                    );


                if (!confirmed) {
                    return;
                }


                form.reset();


                coverPreview.innerHTML =
                    "";


                coverPreview.classList.remove(
                    "active"
                );


                imagesPreview.innerHTML =
                    "";


                coverFileName.textContent =
                    "Aucun fichier sélectionné";


                imagesFileCount.textContent =
                    "Aucune photo sélectionnée";


                previewImage.style
                    .backgroundImage =
                    "";


                previewImage.classList.remove(
                    "has-image"
                );


                previewImage.textContent =
                    "Image principale";


                previewTitle.textContent =
                    "Titre de l'actualité";


                previewDate.textContent =
                    "Date de l'actualité";


                previewText.textContent =
                    "Le début de ton article apparaîtra ici...";


                const todayReset =
                    new Date();


                const resetYear =
                    todayReset.getFullYear();


                const resetMonth =
                    String(
                        todayReset.getMonth() + 1
                    ).padStart(
                        2,
                        "0"
                    );


                const resetDay =
                    String(
                        todayReset.getDate()
                    ).padStart(
                        2,
                        "0"
                    );


                dateInput.value =
                    `${resetYear}-${resetMonth}-${resetDay}`;


                previewDate.textContent =
                    formatDate(
                        dateInput.value
                    );
            }
        );


        // ====================================================
        // PUBLICATION
        // ====================================================

        form.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const title =
                    titleInput.value.trim();


                const date =
                    dateInput.value;


                const content =
                    contentInput.value.trim();


                const cover =
                    coverInput.files[0];


                const images =
                    Array.from(
                        imagesInput.files
                    );


                if (
                    !title ||
                    !date ||
                    !content ||
                    !cover
                ) {

                    window.alert(
                        "Merci de remplir le titre, la date, l'article et l'image principale."
                    );

                    return;
                }


                console.log(
                    "Actualité prête à être publiée :",
                    {
                        title,
                        date,
                        content,
                        cover,
                        images
                    }
                );


                window.alert(
                    "L'interface fonctionne.\n\n"
                    + "La connexion à Google Drive "
                    + "sera ajoutée à l'étape suivante."
                );
            }
        );


        // ====================================================
        // INITIALISATION
        // ====================================================

        const defaultTab =
            document.querySelector(
                ".gestion-tab.active"
            );


        if (defaultTab) {

            activateTab(
                defaultTab
            );

        }

    }
);
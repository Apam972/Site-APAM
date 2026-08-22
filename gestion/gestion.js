document.addEventListener(
    "DOMContentLoaded",
    () => {
                // ====================================================
        // NAVIGATION PAR ONGLETS
        // ====================================================

        const tabs =
            document.querySelectorAll(
                ".gestion-tab"
            );

        const tabContents =
            document.querySelectorAll(
                ".gestion-tab-content"
            );


        tabs.forEach(
            (tab) => {

                tab.addEventListener(
                    "click",
                    () => {

                        const target =
                            tab.dataset.tab;


                        tabs.forEach(
                            (item) => {

                                item.classList.remove(
                                    "active"
                                );
                            }
                        );


                        tabContents.forEach(
                            (content) => {

                                content.classList.remove(
                                    "active"
                                );
                            }
                        );


                        tab.classList.add(
                            "active"
                        );


                        const targetContent =
                            document.querySelector(
                                `[data-content="${target}"]`
                            );


                        if (targetContent) {

                            targetContent.classList.add(
                                "active"
                            );
                        }
                    }
                );
            }
        );

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
        // DATE PAR DÉFAUT
        // ====================================================

        const today =
            new Date();

        const year =
            today.getFullYear();

        const month =
            String(
                today.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                today.getDate()
            ).padStart(2, "0");

        dateInput.value =
            `${year}-${month}-${day}`;


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
            ).format(date);
        }


        // ====================================================
        // PRÉVISUALISATION IMAGE PRINCIPALE
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


                if (files.length === 0) {

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
        // APERÇU TITRE
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
        // APERÇU DATE
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
        // APERÇU ARTICLE
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


                if (confirmed) {
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
                }
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

    }
);
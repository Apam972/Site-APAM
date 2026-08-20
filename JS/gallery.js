document.addEventListener("DOMContentLoaded", async () => {

    const gallery = document.getElementById("apam-gallery");
    let currentIndex = 0;
     let images = [];
    if (!gallery) {
        return;
    }

    try {

        const response = await fetch("./data/images.json");

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

         images = await response.json();

        gallery.innerHTML = "";

        if (!Array.isArray(images) || images.length === 0) {
            gallery.innerHTML = `
                <p class="gallery-empty">
                    Aucune photo disponible pour le moment.
                </p>
            `;
            return;
        }

        images.forEach((image, index) => {

    const item = document.createElement("article");
    item.className = "gallery-item";

    const imageElement = document.createElement("img");

    imageElement.src = `assets/image-apam/${image.file}`;
    imageElement.alt = image.title || "Photo de l'APAM";
    imageElement.loading = "lazy";

    imageElement.addEventListener("click", () => {
    openLightbox(index);
});

    item.appendChild(imageElement);

    gallery.appendChild(item);
});


const lightbox = document.getElementById("photo-lightbox");
const closeButton = document.querySelector(".lightbox-close");
const prevButton = document.querySelector(".lightbox-prev");
const nextButton = document.querySelector(".lightbox-next");

if (prevButton && nextButton) {

    prevButton.addEventListener("click", (event) => {
        event.stopPropagation();
        showPreviousImage();
    });

    nextButton.addEventListener("click", (event) => {
        event.stopPropagation();
        showNextImage();
    });
}

if (lightbox && closeButton) {

    closeButton.addEventListener("click", () => {

        lightbox.classList.remove("active");
        lightbox.setAttribute("aria-hidden", "true");

        const lightboxImage = document.querySelector(".lightbox-image");
        lightboxImage.src = "";
        lightboxImage.alt = "";
    });

    lightbox.addEventListener("click", (event) => {

        if (event.target === lightbox) {

            lightbox.classList.remove("active");
            lightbox.setAttribute("aria-hidden", "true");

            const lightboxImage = document.querySelector(".lightbox-image");
            lightboxImage.src = "";
            lightboxImage.alt = "";
        }
    });
}

    } catch (error) {

        console.error(
            "Impossible de charger la galerie APAM :",
            error
        );

        gallery.innerHTML = `
            <p class="gallery-error">
                Impossible de charger les photos.
            </p>
        `;
    }

    function openLightbox(index) {
    const lightbox = document.getElementById("photo-lightbox");
    const lightboxImage = document.querySelector(".lightbox-image");

    if (!lightbox || !lightboxImage) {
        return;
    }

    currentIndex = index;

    const image = images[currentIndex];

    lightboxImage.src = `assets/image-apam/${image.file}`;
    lightboxImage.alt = image.title || "Photo de l'APAM";

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
}
function showPreviousImage() {
    if (images.length === 0) {
        return;
    }

    currentIndex =
        (currentIndex - 1 + images.length) % images.length;

    openLightbox(currentIndex);
}


function showNextImage() {
    if (images.length === 0) {
        return;
    }

    currentIndex =
        (currentIndex + 1) % images.length;

    openLightbox(currentIndex);
}

});
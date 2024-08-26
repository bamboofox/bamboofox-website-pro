window.addEventListener('scroll', e => {
    document.body.style.cssText = `--scrollTop: ${this.scrollY}px`
    // if more than 100vh
    if (this.scrollY > window.innerHeight) {
        document.body.classList.add('scrolled')
    } else {
        document.body.classList.remove('scrolled')
    }
})
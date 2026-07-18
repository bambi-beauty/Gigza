if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('GIGZA is running as installed PWA');
 
  const installBtns = document.querySelectorAll('.btn-install-nav, .btn-install-mobile, .btn-install-large');
  installBtns.forEach(btn => {
    if (btn) btn.style.display = 'none';
  });
}

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();

  deferredPrompt = e;
  
  const installBtns = document.querySelectorAll('.btn-install-nav, .btn-install-mobile, .btn-install-large');
  installBtns.forEach(btn => {
    if (btn) btn.style.display = 'inline-flex';
  });
  
  console.log('GIGZA can be installed!');
});

function updateInstallButtons() {
  const installBtns = [
    document.getElementById('installBtn'),
    document.getElementById('mobileInstallBtn'),
    document.getElementById('ctaInstallBtn')
  ];
  
  installBtns.forEach(btn => {
    if (btn) {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (deferredPrompt) {

          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
              console.log('User accepted the install prompt');

              const allBtns = document.querySelectorAll('.btn-install-nav, .btn-install-mobile, .btn-install-large');
              allBtns.forEach(btn => {
                btn.style.display = 'none';
              });
            } else {
              console.log('User dismissed the install prompt');
             
              showInstallGuide();
            }
            deferredPrompt = null;
          });
        } else {
      
          showInstallGuide();
        }
      });
    }
  });
}


window.addEventListener('load', () => {
  updateInstallButtons();
});

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
  });
}


const mobileLinks = document.querySelectorAll('.mobile-menu a');
mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
  });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});


function showInstallGuide() {

  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';
  

  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.maxWidth = '400px';
  modalContent.style.width = '90%';
  modalContent.style.padding = '2rem';
  modalContent.style.borderRadius = '24px';
  modalContent.style.textAlign = 'center';
  modalContent.style.fontFamily = 'Inter, sans-serif';
  

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  
  let instructionText = "Click the share icon in your browser → 'Add to Home Screen'";
  if (isIOS) instructionText = "Tap Share button → scroll down → 'Add to Home Screen'";
  if (isAndroid) instructionText = "Tap menu (three dots) → 'Install App' or 'Add to Home screen'";
  
  modalContent.innerHTML = `
    <i class="fas fa-mobile-alt" style="font-size: 3rem; color: #FF00FF; margin-bottom: 1rem;"></i>
    <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: #1a1a2e;">Install GIGZA App</h3>
    <p style="margin-bottom: 1.5rem; color: #5a5a7a;">Get offline access and home screen shortcut.</p>
    <div style="background: #f5f0ff; padding: 1rem; border-radius: 16px; margin-bottom: 1rem;">
      <strong style="color: #FF00FF;">📲 How to install:</strong><br>
      <span style="color: #1a1a2e;">${instructionText}</span>
    </div>
    <button id="closeModalBtn" style="background: #FF00FF; border: none; color: white; padding: 0.7rem 1.8rem; border-radius: 40px; font-weight: bold; cursor: pointer;">Got it</button>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  

  document.getElementById('closeModalBtn').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}


const installBtns = [
  document.getElementById('installBtn'),
  document.getElementById('mobileInstallBtn'),
  document.getElementById('ctaInstallBtn')
];

installBtns.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showInstallGuide();
    });
  }
});


const findDJBtn = document.querySelector('.btn-primary');
const joinCreativeBtn = document.querySelector('.btn-outline');

if (findDJBtn) {
  findDJBtn.addEventListener('click', () => {
    alert('🚀 Coming soon! You\'ll be able to browse and book DJs instantly.');
  });
}

if (joinCreativeBtn) {
  joinCreativeBtn.addEventListener('click', () => {
    alert('🎧 Join GIGZA as a creative! Registration coming soon.');
  });
}

const cards = document.querySelectorAll('.about-card, .feature-item, .mode-card, .testimonial');

// Function to check if element is visible
function isElementVisible(el) {
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.top <= windowHeight - 100;
}

// Function to show visible cards
function showVisibleCards() {
  cards.forEach(card => {
    if (isElementVisible(card)) {
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }
  });
}

cards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.6s ease, transform 0.5s ease';
});

window.addEventListener('scroll', showVisibleCards);
window.addEventListener('load', showVisibleCards);

console.log('GIGZA website ready!');

function openModal(type) {
  const modal = document.getElementById('legalModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalBody.innerHTML = '<p style="text-align:center; padding:2rem;">Loading...</p>';
  
  if (type === 'terms') {
    modalTitle.innerHTML = 'Terms of Service';
   
    fetch('/terms.html')
      .then(response => response.text())
      .then(html => {
     
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.legal-container');
        if (content) {
          modalBody.innerHTML = content.innerHTML;
        } else {
          modalBody.innerHTML = '<p>Content not found</p>';
        }
      })
      .catch(error => {
        modalBody.innerHTML = '<p>Error loading content. Please try again later.</p>';
        console.error('Error loading terms:', error);
      });
  } else if (type === 'privacy') {
    modalTitle.innerHTML = 'Privacy Policy';
   
    fetch('/privacy.html')
      .then(response => response.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const content = doc.querySelector('.legal-container');
        if (content) {
          modalBody.innerHTML = content.innerHTML;
        } else {
          modalBody.innerHTML = '<p>Content not found</p>';
        }
      })
      .catch(error => {
        modalBody.innerHTML = '<p>Error loading content. Please try again later.</p>';
        console.error('Error loading privacy:', error);
      });
  }
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('legalModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

const modal = document.getElementById('legalModal');
if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}
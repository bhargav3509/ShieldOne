import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function LandingPage({ onEnter, theme }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    let particlesArray = [];
    let animationFrameId;
    
    // Mouse tracking for interaction
    const mouse = {
      x: null,
      y: null,
      radius: 80
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = null;
      mouse.y = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const text = 'sheildOne';
    
    // Particle Class
    class Particle {
      constructor(x, y, color) {
        // Spawn randomly from one of the 4 screen edges
        const edge = Math.floor(Math.random() * 4);
        if (edge === 0) {
          this.x = Math.random() * canvas.width;
          this.y = -20;
        } else if (edge === 1) {
          this.x = Math.random() * canvas.width;
          this.y = canvas.height + 20;
        } else if (edge === 2) {
          this.x = -20;
          this.y = Math.random() * canvas.height;
        } else {
          this.x = canvas.width + 20;
          this.y = Math.random() * canvas.height;
        }
        this.size = 2; // Pixel size
        this.baseX = x;
        this.baseY = y;
        this.color = color;
        this.density = (Math.random() * 30) + 1; // Used for repel speed
        this.vx = 0;
        this.vy = 0;
      }
      
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.size, this.size);
        ctx.fill();
      }

      update() {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        let forceDirectionX = dx / distance;
        let forceDirectionY = dy / distance;
        
        // Max distance, past that the force is 0
        let maxDistance = mouse.radius;
        let force = (maxDistance - distance) / maxDistance;
        let directionX = forceDirectionX * force * this.density;
        let directionY = forceDirectionY * force * this.density;

        if (distance < mouse.radius && mouse.x !== null) {
          // Repel from mouse
          this.x -= directionX;
          this.y -= directionY;
        } else {
          // Return to base position (combine to form the word)
          if (this.x !== this.baseX) {
            let dxBase = this.x - this.baseX;
            this.x -= dxBase / 35; // Slower ease back to position
          }
          if (this.y !== this.baseY) {
            let dyBase = this.y - this.baseY;
            this.y -= dyBase / 35; // Slower ease back to position
          }
        }
      }
    }

    const initParticles = () => {
      particlesArray = [];
      
      // Draw text to read pixel data
      ctx.fillStyle = 'white';
      // Use the global font we set in styles.css
      ctx.font = `bold ${Math.min(canvas.width / 8, 150)}px 'Bitcount Single', system-ui, sans-serif`;
      
      const textMetrics = ctx.measureText(text);
      const textWidth = textMetrics.width;
      
      const startX = (canvas.width - textWidth) / 2;
      const startY = canvas.height / 2;
      
      ctx.fillText(text, startX, startY);

      // Extract pixel data
      const textCoordinates = ctx.getImageData(0, 0, canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clear the actual text

      // Loop over every pixel. To save performance, we sample every 4th pixel
      const sampleRate = 3; 
      
      // Create a gradient for the particles
      for (let y = 0, y2 = textCoordinates.height; y < y2; y += sampleRate) {
        for (let x = 0, x2 = textCoordinates.width; x < x2; x += sampleRate) {
          // imageData.data is a 1D array of RGBA values [r,g,b,a, r,g,b,a...]
          // We check the Alpha channel (opacity) to see if a pixel was drawn there
          const alphaIndex = (y * 4 * textCoordinates.width) + (x * 4) + 3;
          if (textCoordinates.data[alphaIndex] > 128) {
            
            // Generate a monochromatic color based on theme
            let shade;
            if (theme === 'light') {
              shade = Math.floor(Math.random() * 105) + 50; // 50-155 (dark gray)
            } else {
              shade = Math.floor(Math.random() * 105) + 150; // 150-255 (light gray/white)
            }
            const alpha = (Math.random() * 0.5 + 0.5).toFixed(2); // 0.5 - 1.0
            
            particlesArray.push(new Particle(x, y, `rgba(${shade},${shade},${shade},${alpha})`));
          }
        }
      }
      
      // Once particles are initialized, show the button
      setTimeout(() => setIsReady(true), 2500); 
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].draw();
        particlesArray[i].update();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleEnter = () => {
    // Exit animation for the landing page
    const tl = gsap.timeline({ onComplete: onEnter });
    
    if (buttonRef.current) {
      tl.to(buttonRef.current, { opacity: 0, y: 20, duration: 0.3 });
    }
    
    tl.to(canvasRef.current, { 
      opacity: 0, 
      scale: 1.1, 
      filter: 'blur(20px)',
      duration: 1, 
      ease: 'power3.inOut' 
    });
  };

  return (
    <div ref={containerRef} className="landing-container">
      <canvas ref={canvasRef} className="landing-canvas" />
      
      {isReady && (
        <button 
          ref={buttonRef} 
          className="btn btn-glow landing-enter-btn fade-in"
          onClick={handleEnter}
        >
          Initialize System
        </button>
      )}
    </div>
  );
}

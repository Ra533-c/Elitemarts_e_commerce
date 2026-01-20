'use client';

import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const StyledWrapper = styled.div`
  button {
    font-family: Inter, Arial, sans-serif;
    font-weight: 700;
    font-size: 1.1rem;
    color: white;
    background: linear-gradient(135deg, #6d28d9, #9333ea);
    padding: 1.1em 2.8em;
    border: none;
    border-radius: 999px;
    position: relative;
    cursor: pointer;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 0.6rem;
    box-shadow: 0 10px 30px rgba(109, 40, 217, 0.35);
    transition: box-shadow 0.3s ease;
  }

  button:hover {
    box-shadow: 0 15px 40px rgba(147, 51, 234, 0.5);
  }

  button:focus {
    outline: 3px solid rgba(147, 51, 234, 0.5);
    outline-offset: 3px;
  }

  button span.circle {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    height: 30px;
    width: 30px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transition: 0.6s ease;
    pointer-events: none;
  }

  button:hover span.circle {
    transform: translate(-50%, -50%) scale(5);
    transition: 1.2s ease;
    opacity: 0;
  }

  .text {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .price {
    font-size: 0.85rem;
    opacity: 0.9;
    margin-left: 0.3rem;
  }

  .original-price {
    text-decoration: line-through;
    opacity: 0.6;
    font-size: 0.75rem;
    margin-left: 0.4rem;
  }
`;

export default function OrderNowButton({ className = '' }) {
    const router = useRouter();
    const buttonRef = useRef(null);

    const handleClick = () => {
        // GSAP click animation
        if (buttonRef.current) {
            gsap.fromTo(
                buttonRef.current,
                { boxShadow: '0 10px 30px rgba(109, 40, 217, 0.35)' },
                {
                    boxShadow: '0 0 60px rgba(147, 51, 234, 0.8)',
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        router.push('/order');
                    }
                }
            );
        } else {
            router.push('/order');
        }
    };

    return (
        <StyledWrapper className={className}>
            <motion.button
                ref={buttonRef}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                onClick={handleClick}
                aria-label="Order Now for ₹1199"
            >
                <span className="circle" style={{ animationDelay: '0s' }} />
                <span className="circle" style={{ animationDelay: '0.1s' }} />
                <span className="circle" style={{ animationDelay: '0.2s' }} />
                <span className="circle" style={{ animationDelay: '0.3s' }} />
                <span className="circle" style={{ animationDelay: '0.4s' }} />

                <span className="text">
                    <ShoppingCart size={20} />
                    Order Now
                    <span className="price">₹1,199</span>
                    <span className="original-price">₹2,999</span>
                </span>
            </motion.button>
        </StyledWrapper>
    );
}

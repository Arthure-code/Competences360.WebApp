import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap } from '@fortawesome/free-solid-svg-icons';
import styles from './LogoPrimary.module.css';

interface LogoPrimaryProps {
  size?: 'md' | 'lg';
  href?: string;
  variant?: 'full' | 'mini'; // Nouvelle option
}

export default function LogoPrimary({ 
  size = 'md', 
  href = '/', 
  variant = 'full' 
}: LogoPrimaryProps) {
  return (
    <a href={href} className={[styles.logo, size === 'lg' ? styles.lg : ''].join(' ')}>
      <span className={styles.mark}>
        <FontAwesomeIcon icon={faGraduationCap} className={styles.icon} />
      </span>
      {variant === 'full' && (
        <span className={styles.wordmark}>Compétences 360</span>
      )}
    </a>
  );
}
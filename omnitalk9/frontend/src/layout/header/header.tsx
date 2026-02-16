import React from 'react';
import styles from './header.module.less';

const Header = () => {
    return (
        <div className={styles.header}>
            <div className={styles.headerTitle}>
                <span className={styles.logoText}>OmniTalk X</span>
            </div>
        </div>
    );
};

export default Header;

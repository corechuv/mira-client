// src/components/CategoryDrawer.tsx
import styles from "./CategoryDrawer.module.scss";
import { useState } from "react";
import { categories, CategoryNode } from "@/data/categories";
import { navigate } from "@/router/Router";
import { useProducts } from "@/contexts/ProductsContext";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

type Props = { onClose: () => void };

export default function CategoryDrawer({ onClose }: Props) {
    const [trail, setTrail] = useState<CategoryNode[]>([]);
    const level = trail.length;
    const { setFilterPath } = useProducts(); // требуется поле в ProductsContext

    const listAt = (lvl: number): CategoryNode[] => {
        if (lvl === 0) return categories;
        const parent = trail[lvl - 1];
        return parent?.children ?? [];
    };

    const go = (node: CategoryNode) => {
        if (node.children && node.children.length > 0) {
            setTrail((t) => [...t, node]);
        } else {
            const path = [...trail, node].map((n) => n.title);
            setFilterPath(path);     // применяем фильтр
            onClose();
            navigate("/catalog");    // переходим в каталог
        }
    };

    const back = () => setTrail((t) => t.slice(0, -1));
    const reset = () => setTrail([]);

    return (
        <div className={styles.wrap}>
            <div className={styles.toolbar}>
                {level > 0 ? (
                    <div className={styles.btnIcon} onClick={back}>
                        <Icon name="arrow-left" width={20} />
                    </div>
                ) : (
                    <div className={styles.btnIcon} onClick={back}>
                    </div>
                )}
                <div className={styles.breadcrumbs}>
                    {level === 0 ? "Категории" : trail.map((n) => n.title).join(" / ")}
                </div>
            </div>

            <div className={styles.viewport}>
                <div className={styles.track} style={{ transform: `translateX(${-level * 100}%)` }}>
                    {/* Уровень 0 */}
                    <ul className={styles.col}>
                        {listAt(0).map((n) => (
                            <li key={n.slug}>
                                <button className={styles.item} onClick={() => go(n)}>
                                    <span>{n.title}</span>
                                    {n.children && <span className={styles.chev}>›</span>}
                                </button>
                            </li>
                        ))}
                    </ul>

                    {/* Уровень 1 */}
                    {trail[0] && (
                        <ul className={styles.col}>
                            {listAt(1).map((n) => (
                                <li key={n.slug}>
                                    <button className={styles.item} onClick={() => go(n)}>
                                        <span>{n.title}</span>
                                        {n.children && <span className={styles.chev}>›</span>}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Уровень 2 */}
                    {trail[1] && (
                        <ul className={styles.col}>
                            {listAt(2).map((n) => (
                                <li key={n.slug}>
                                    <button className={styles.item} onClick={() => go(n)}>
                                        <span>{n.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                </div>
            </div>
            {/* переключатель темы */}
            <ThemeToggle />
        </div>
    );
}

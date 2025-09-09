import * as React from "react";

const LogoMark: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
    className,
    ...props
}) => {
    return (
        <img src="/logo_full.png" alt="Mira shop" {...props} className={className} />
    );
};

export default LogoMark;

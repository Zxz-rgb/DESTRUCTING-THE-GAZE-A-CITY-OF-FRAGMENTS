// 为指定箭头添加跳转功能
document.querySelector('.toilet-arrow').addEventListener('click', () => {
    // 添加过渡动画
    const arrow = document.querySelector('.toilet-arrow .arrow');
    arrow.style.transform = 'scale(1.2)';
    arrow.style.borderColor = 'rgba(137, 247, 254, 1)';
    arrow.style.boxShadow = '0 0 30px rgba(137, 247, 254, 0.6)';
    
    // 延迟后跳转
    setTimeout(() => {
        window.location.href = 'hongkong.html';
    }, 600);
});

// 让箭头可拖动（可选功能）
const arrows = document.querySelectorAll('.arrow-container');
arrows.forEach(arrow => {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    arrow.addEventListener('mousedown', dragStart);
    arrow.addEventListener('mousemove', drag);
    arrow.addEventListener('mouseup', dragEnd);
    arrow.addEventListener('mouseleave', dragEnd);

    function dragStart(e) {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        if (e.target === arrow) {
            isDragging = true;
        }
    }

    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            xOffset = currentX;
            yOffset = currentY;
            setTranslate(currentX, currentY, arrow);
        }
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }
});
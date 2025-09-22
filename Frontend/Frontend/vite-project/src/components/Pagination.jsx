export default function Pagination({ page, pages, onPage }) {
    if (pages <= 1) return null;

    const renderPageButton = (p) => (
        <button
            key={p}
            className={p === page ? "primary" : ""}
            onClick={() => onPage(p)}
            disabled={p === page}
        >
            {p}
        </button>
    );

    const renderButtons = () => {
        const btns = [];

        if (pages <= 5) {
            for (let i = 1; i <= pages; i++) btns.push(renderPageButton(i));
        } else {
            btns.push(renderPageButton(1));
            if (page > 3) btns.push(<span key="start-dots">…</span>);

            const start = Math.max(2, page - 1);
            const end = Math.min(pages - 1, page + 1);
            for (let i = start; i <= end; i++) btns.push(renderPageButton(i));

            if (page < pages - 2) btns.push(<span key="end-dots">…</span>);
            btns.push(renderPageButton(pages));
        }

        return btns;
    };

    return (
        <div className="pagination row gap center">
            <button onClick={() => onPage(page - 1)} disabled={page <= 1}>
                ◀
            </button>

            {renderButtons()}

            <button onClick={() => onPage(page + 1)} disabled={page >= pages}>
                ▶
            </button>
        </div>
    );
}

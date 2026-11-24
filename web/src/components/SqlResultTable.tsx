import type { ResultSet } from "../api";

export function SqlResultTable({ set }: { set: Omit<ResultSet, "label"> }) {
  if (set.rowsAffected != null && set.columns.length === 0) {
    return <p>{set.rowsAffected} række(r) påvirket.</p>;
  }
  return (
    <>
      {set.truncated && <p className="muted">Viser max antal rækker.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {set.columns.map((column, index) => <th key={index} scope="col">{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {set.rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, position) => <td key={position}>{cell == null ? "NULL" : String(cell)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

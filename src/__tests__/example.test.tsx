import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
  );
}

describe("test setup", () => {
  it("renders a component and handles interaction", async () => {
    const user = userEvent.setup();
    render(<Counter />);

    const button = screen.getByRole("button", { name: /count: 0/i });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(button).toHaveTextContent("Count: 1");
  });
});

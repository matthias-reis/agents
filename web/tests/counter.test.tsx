import { fireEvent, render, screen } from "@solidjs/testing-library";
import Counter from "~/components/Counter";

describe("Counter", () => {
  it("increments when clicked", async () => {
    render(() => <Counter />);

    const button = await screen.findByRole("button", { name: /clicks/i });
    expect(button).toHaveTextContent("Clicks");
    expect(button).toHaveTextContent("0");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(button).toHaveTextContent("2");
  });
});

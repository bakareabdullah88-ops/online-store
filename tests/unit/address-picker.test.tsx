import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddressFields, AddressPicker } from "@/components/address/address-picker";
import { seedCampuses } from "@/services/mock/seed/campuses";

const unilag = seedCampuses().find((c) => c.id === "c_unilag")!;

afterEach(cleanup);

describe("address picker", () => {
  it("filters as you type and picks with the keyboard", () => {
    const onChange = vi.fn();
    render(<AddressPicker campus={unilag} value="" onChange={onChange} label="Where" />);
    const box = screen.getByRole("combobox", { name: "Where" });
    fireEvent.focus(box);
    expect(box.getAttribute("aria-expanded")).toBe("true");
    fireEvent.change(box, { target: { value: "jaja" } });
    const options = screen.getAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Jaja Hall"]);
    expect(box.getAttribute("aria-activedescendant")).toBe(options[0]!.id);
    fireEvent.keyDown(box, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("unilag-z2");
    expect(box.getAttribute("aria-expanded")).toBe("false");
  });

  it("only offers the kinds asked for, and can be cleared", () => {
    const onChange = vi.fn();
    render(
      <AddressPicker
        campus={unilag}
        value="unilag-z1"
        onChange={onChange}
        kinds={["hostel"]}
        label="Your hall"
        clearable
      />,
    );
    const box = screen.getByRole<HTMLInputElement>("combobox", { name: /Your hall/ });
    expect(box.value).toBe("Moremi Hall");
    fireEvent.keyDown(box, { key: "ArrowDown" });
    expect(screen.getAllByRole("option").length).toBe(
      unilag.zones.filter((z) => z.kind === "hostel").length,
    );
    fireEvent.keyDown(box, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Clear Moremi Hall" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("asks for a street address off campus", () => {
    function Harness() {
      const [zoneId, setZone] = useState("unilag-z7");
      const [detail, setDetail] = useState("");
      return (
        <AddressFields
          campus={unilag}
          zoneId={zoneId}
          detail={detail}
          onZoneChange={setZone}
          onDetailChange={setDetail}
        />
      );
    }
    render(<Harness />);
    const street = screen.getByLabelText("Street address");
    expect(street.getAttribute("placeholder")).toMatch(/Yaba/);
  });
});

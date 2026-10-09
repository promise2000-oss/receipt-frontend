import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, readableError } from "./api";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubFetch(response: Response | Error): void {
  vi.stubGlobal(
    "fetch",
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Await a call that is expected to fail, and hand back what it failed with. */
async function rejection(call: () => Promise<unknown>): Promise<ApiError> {
  try {
    await call();
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    return error as ApiError;
  }
  throw new Error("expected the call to reject, but it resolved");
}

/**
 * When the API sits behind the Next.js rewrite, a service that cannot be
 * reached and a service that failed both arrive as a 5xx — the difference is
 * that ours always speaks JSON. Getting this wrong in either direction costs
 * the reader something: misreporting an outage as a bug sends them looking in
 * the wrong place, and misreporting a bug as an outage hides it.
 */
describe("reading a failed request", () => {
  it("treats a bodyless 5xx as the API being unreachable", async () => {
    stubFetch(new Response(null, { status: 500 }));

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.status).toBe(500);
    expect(error.message).toMatch(/can't reach the receipt service/i);
  });

  it("treats Next's plain-text proxy error the same way", async () => {
    // Observed against the running dev server: a rewrite whose target cannot
    // be reached answers 500 with this body verbatim, no content-type.
    stubFetch(
      new Response("Internal Server Error", {
        status: 500,
        headers: { "content-type": "text/plain" },
      }),
    );

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toMatch(/can't reach the receipt service/i);
  });

  it("treats an HTML 5xx the same way", async () => {
    stubFetch(
      new Response("<html><h1>500</h1></html>", {
        status: 500,
        headers: { "content-type": "text/html" },
      }),
    );

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).toMatch(/can't reach the receipt service/i);
  });

  it("leaves a real error from the API alone", async () => {
    stubFetch(
      jsonResponse(500, {
        message: "The ledger is unavailable.",
        code: "LEDGER_DOWN",
      }),
    );

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.message).toBe("The ledger is unavailable.");
    expect(error.code).toBe("LEDGER_DOWN");
  });

  it("falls back to the generic copy when a JSON 5xx says nothing useful", async () => {
    stubFetch(jsonResponse(500, {}));

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.message).toBe("The receipt service returned an error (500).");
  });

  it("reports a request that never reached the server", async () => {
    stubFetch(new TypeError("getaddrinfo EAI_AGAIN receipt-backend"));

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/can't reach/i);
  });

  it("still passes structured 4xx responses through untouched", async () => {
    stubFetch(
      jsonResponse(422, { message: "That logo is too small.", code: "IMAGE_TOO_SMALL" }),
    );

    const error = await rejection(() => api.getDashboardSummary());
    expect(error.status).toBe(422);
    expect(error.code).toBe("IMAGE_TOO_SMALL");
    expect(error.message).toBe("That logo is too small.");
  });
});

describe("getSession", () => {
  it("reads 401 as nobody being signed in", async () => {
    stubFetch(jsonResponse(401, { message: "Session expired." }));
    await expect(api.getSession()).resolves.toBeNull();
  });

  it("does not sign the user out because the service failed", async () => {
    stubFetch(new Response(null, { status: 500 }));

    const error = await rejection(() => api.getSession());
    expect(error.code).toBe("NETWORK_ERROR");
  });
});

describe("readableError", () => {
  it("passes an API failure through unchanged", () => {
    const original = new ApiError(
      "Can't reach the receipt service.",
      500,
      "NETWORK_ERROR",
    );
    expect(readableError(original)).toBe(
      "Can't reach the receipt service.",
    );
  });

  it("replaces anything else with copy a reader can act on", () => {
    const expected = "Something went wrong loading this. Try again.";
    // No stacks, no "[object Object]" — these are rendered inline.
    expect(readableError(new Error("TypeError: at request (api.ts:225:11)"))).toBe(expected);
    expect(readableError(undefined)).toBe(expected);
    expect(readableError("a bare string")).toBe(expected);
  });
});

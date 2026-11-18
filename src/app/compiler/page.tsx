import type { Metadata } from "next";
import Link from "next/link";
import { CodeRunner } from "@/components/CodeRunner";
import { getSession } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "C++ and Java compiler",
  description: "Write, compile and run C++ and Java in the browser.",
};

const STARTER = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    string name;
    cin >> name;
    cout << "Assalam o Alaikum, " << name << "!" << endl;
    return 0;
}
`,
  java: `import java.util.*;

class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        String name = in.next();
        System.out.println("Assalam o Alaikum, " + name + "!");
    }
}
`,
};

export default async function CompilerPage() {
  const session = await getSession();
  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Compiler
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Write C++ 17 or Java 21, give it input, and run it. Good for lab
            tasks and trying out ideas. In Java, keep main inside a class.
          </p>
        </div>
        <Link href="/practice" className="btn btn-quiet">
          Practice problems
        </Link>
      </div>
      <div className="mt-8">
        <CodeRunner
          storageKey="playground"
          starter={STARTER}
          signedIn={Boolean(session)}
          defaultStdin="Ahmad"
          nextPath="/compiler"
        />
      </div>
    </div>
  );
}

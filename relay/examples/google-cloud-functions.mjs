import { http } from "@google-cloud/functions-framework";
import { createProxyRelayHandler } from "hookhq-relay";

http("relay", createProxyRelayHandler());

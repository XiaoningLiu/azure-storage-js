import * as assert from "assert";

import { BlobURL } from "../lib/BlobURL";
import { BlockBlobURL } from "../lib/BlockBlobURL";
import { ContainerURL } from "../lib/ContainerURL";
import {
    LeaseDurationType, LeaseStateType, LeaseStatusType, ListBlobsIncludeItem, PublicAccessType
} from "../lib/generated/models";
import { getBSU, getUniqueName, sleep } from "./utils";

describe("ContainerURL", () => {
  const serviceURL = getBSU();
  let containerName: string = getUniqueName("container");
  let containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);

  beforeEach(async () => {
    containerName = getUniqueName("container");
    containerURL = ContainerURL.fromServiceURL(serviceURL, containerName);
    await containerURL.create();
  });

  afterEach(async () => {
    await containerURL.delete();
  });

  it("setMetadata", async () => {
    const metadata = {
      key0: "val0",
      keya: "vala",
      keyb: "valb"
    };
    await containerURL.setMetadata({
      metadata
    });

    const result = await containerURL.getProperties();
    assert.deepEqual(result.metadata, metadata);
  });

  it("getProperties", async () => {
    const result = await containerURL.getProperties();
    assert.ok(result.eTag!.length > 0);
    assert.ok(result.lastModified);
    assert.ok(!result.leaseDuration);
    assert.equal(result.leaseState, LeaseStateType.Available);
    assert.equal(result.leaseStatus, LeaseStatusType.Unlocked);
    assert.ok(result.requestId);
    assert.ok(result.version);
    assert.ok(result.date);
    assert.ok(!result.blobPublicAccess);
  });

  it("create with default parameters", done => {
    // create() with default parameters has been tested in beforeEach
    done();
  });

  it("create with all parameters configured", async () => {
    const cURL = ContainerURL.fromServiceURL(
      serviceURL,
      getUniqueName(containerName)
    );
    const metadata = { key: "value" };
    const access = PublicAccessType.Container;
    await cURL.create({ metadata, access });
    const result = await cURL.getProperties();
    assert.deepEqual(result.blobPublicAccess, access);
    assert.deepEqual(result.metadata, metadata);
  });

  it("delete", done => {
    // delete() with default parameters has been tested in afterEach
    done();
  });

  it("getAccessPolicy", async () => {
    const result = await containerURL.getAccessPolicy();
    assert.ok(result.eTag!.length > 0);
    assert.ok(result.lastModified);
    assert.ok(result.requestId);
    assert.ok(result.version);
    assert.ok(result.date);
  });

  it("setAccessPolicy", async () => {
    const access = PublicAccessType.Blob;
    const containerAcl = [
      {
        accessPolicy: {
          expiry: new Date("2017-01-01"),
          permission: "rwd",
          start: new Date("2018-12-31")
        },
        id: "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI="
      }
    ];

    // tslint:disable-next-line:max-line-length
    // TODO: Protocol layer serilizes XML body like "<containerAcl><SignedIdentifier><Id>MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=</Id><AccessPolicy><Start>2018-12-31T00:00:00.000Z</Start><Expiry>2017-01-01T00:00:00.000Z</Expiry><Permission>rwd</Permission></AccessPolicy></SignedIdentifier></containerAcl>"
    // Shoud remove "containerAcl"
    await containerURL.setAccessPolicy(access, containerAcl);
    const result = await containerURL.getAccessPolicy();
    assert.deepEqual(result.signedIdentifiers, containerAcl);
    assert.deepEqual(result.blobPublicAccess, access);
  });

  it("acquireLease", async () => {
    const guid = "ca761232ed4211cebacd00aa0057b223";
    const duration = 30;
    await containerURL.acquireLease(guid, duration);

    const result = await containerURL.getProperties();
    assert.equal(result.leaseDuration, LeaseDurationType.Fixed);
    assert.equal(result.leaseState, LeaseStateType.Leased);
    assert.equal(result.leaseStatus, LeaseStatusType.Locked);

    await containerURL.releaseLease(guid);
  });

  it("releaseLease", async () => {
    const guid = "ca761232ed4211cebacd00aa0057b223";
    const duration = -1;
    await containerURL.acquireLease(guid, duration);

    const result = await containerURL.getProperties();
    assert.equal(result.leaseDuration, LeaseDurationType.Infinite);
    assert.equal(result.leaseState, LeaseStateType.Leased);
    assert.equal(result.leaseStatus, LeaseStatusType.Locked);

    await containerURL.releaseLease(guid);
  });

  it("renewLease", async () => {
    const guid = "ca761232ed4211cebacd00aa0057b223";
    const duration = 15;
    await containerURL.acquireLease(guid, duration);

    const result = await containerURL.getProperties();
    assert.equal(result.leaseDuration, LeaseDurationType.Fixed);
    assert.equal(result.leaseState, LeaseStateType.Leased);
    assert.equal(result.leaseStatus, LeaseStatusType.Locked);

    await sleep(16 * 1000);
    const result2 = await containerURL.getProperties();
    assert.ok(!result2.leaseDuration);
    assert.equal(result2.leaseState, LeaseStateType.Expired);
    assert.equal(result2.leaseStatus, LeaseStatusType.Unlocked);

    await containerURL.renewLease(guid);
    const result3 = await containerURL.getProperties();
    assert.equal(result3.leaseDuration, LeaseDurationType.Fixed);
    assert.equal(result3.leaseState, LeaseStateType.Leased);
    assert.equal(result3.leaseStatus, LeaseStatusType.Locked);

    await containerURL.releaseLease(guid);
  });

  it("changeLease", async () => {
    const guid = "ca761232ed4211cebacd00aa0057b223";
    const duration = 15;
    await containerURL.acquireLease(guid, duration);

    const result = await containerURL.getProperties();
    assert.equal(result.leaseDuration, LeaseDurationType.Fixed);
    assert.equal(result.leaseState, LeaseStateType.Leased);
    assert.equal(result.leaseStatus, LeaseStatusType.Locked);

    const newGuid = "3c7e72ebb4304526bc53d8ecef03798f";
    await containerURL.changeLease(guid, newGuid);

    await containerURL.getProperties();
    await containerURL.releaseLease(newGuid);
  });

  it("breakLease", async () => {
    const guid = "ca761232ed4211cebacd00aa0057b223";
    const duration = 15;
    await containerURL.acquireLease(guid, duration);

    const result = await containerURL.getProperties();
    assert.equal(result.leaseDuration, LeaseDurationType.Fixed);
    assert.equal(result.leaseState, LeaseStateType.Leased);
    assert.equal(result.leaseStatus, LeaseStatusType.Locked);

    await containerURL.breakLease(3);

    const result2 = await containerURL.getProperties();
    assert.ok(!result2.leaseDuration);
    assert.equal(result2.leaseState, LeaseStateType.Breaking);
    assert.equal(result2.leaseStatus, LeaseStatusType.Locked);

    await sleep(3 * 1000);

    const result3 = await containerURL.getProperties();
    assert.ok(!result3.leaseDuration);
    assert.equal(result3.leaseState, LeaseStateType.Broken);
    assert.equal(result3.leaseStatus, LeaseStatusType.Unlocked);
  });

  it("listBlobFlatSegment with default parameters", async () => {
    const blobURLs = [];
    for (let i = 0; i < 3; i++) {
      const blobURL = BlobURL.fromContainerURL(
        containerURL,
        getUniqueName(`blockblob/${i}`)
      );
      const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
      await blockBlobURL.upload("", 0);
      blobURLs.push(blobURL);
    }

    const result = await containerURL.listBlobFlatSegment();
    assert.ok(result.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result.containerName));
    assert.deepStrictEqual(result.nextMarker, "");
    assert.deepStrictEqual(result.segment.blobItems!.length, blobURLs.length);
    assert.ok(blobURLs[0].url.indexOf(result.segment.blobItems![0].name));

    for (const blob of blobURLs) {
      await blob.delete();
    }
  });

  it("listBlobFlatSegment with all parameters configured", async () => {
    const blobURLs = [];
    const prefix = "blockblob";
    const metadata = {
      keya: "a",
      keyb: "c"
    };
    for (let i = 0; i < 2; i++) {
      const blobURL = BlobURL.fromContainerURL(
        containerURL,
        getUniqueName(`${prefix}/${i}`)
      );
      const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
      await blockBlobURL.upload("", 0, {
        metadata
      });
      blobURLs.push(blobURL);
    }

    const result = await containerURL.listBlobFlatSegment(undefined, {
      include: [
        ListBlobsIncludeItem.Snapshots,
        ListBlobsIncludeItem.Metadata,
        ListBlobsIncludeItem.Uncommittedblobs,
        ListBlobsIncludeItem.Copy,
        ListBlobsIncludeItem.Deleted
      ],
      maxresults: 1,
      prefix
    });
    assert.ok(result.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result.containerName));
    assert.deepStrictEqual(result.segment.blobItems!.length, 1);
    assert.ok(blobURLs[0].url.indexOf(result.segment.blobItems![0].name));
    assert.deepStrictEqual(result.segment.blobItems![0].metadata, metadata);

    const result2 = await containerURL.listBlobFlatSegment(result.nextMarker, {
      include: [
        ListBlobsIncludeItem.Snapshots,
        ListBlobsIncludeItem.Metadata,
        ListBlobsIncludeItem.Uncommittedblobs,
        ListBlobsIncludeItem.Copy,
        ListBlobsIncludeItem.Deleted
      ],
      maxresults: 2,
      prefix
    });

    assert.ok(result2.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result2.containerName));
    assert.deepStrictEqual(result2.segment.blobItems!.length, 1);
    assert.ok(blobURLs[0].url.indexOf(result2.segment.blobItems![0].name));
    assert.deepStrictEqual(result2.segment.blobItems![0].metadata, metadata);

    for (const blob of blobURLs) {
      await blob.delete();
    }
  });

  it("listBlobHierarchySegment with default parameters", async () => {
    const blobURLs = [];
    for (let i = 0; i < 3; i++) {
      const blobURL = BlobURL.fromContainerURL(
        containerURL,
        getUniqueName(`blockblob${i}/${i}`)
      );
      const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
      await blockBlobURL.upload("", 0);
      blobURLs.push(blobURL);
    }

    const delimiter = "/";
    const result = await containerURL.listBlobHierarchySegment(delimiter);
    assert.ok(result.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result.containerName));
    assert.deepStrictEqual(result.nextMarker, "");
    assert.deepStrictEqual(result.delimiter, delimiter);
    assert.deepStrictEqual(
      result.segment.blobPrefixes!.length,
      blobURLs.length
    );

    for (const blob of blobURLs) {
      let i = 0;
      assert.ok(blob.url.indexOf(result.segment.blobPrefixes![i++].name));
    }

    for (const blob of blobURLs) {
      await blob.delete();
    }
  });

  it("listBlobHierarchySegment with all parameters configured", async () => {
    const blobURLs = [];
    const prefix = "blockblob";
    const metadata = {
      keya: "a",
      keyb: "c"
    };
    const delimiter = "/";
    for (let i = 0; i < 2; i++) {
      const blobURL = BlobURL.fromContainerURL(
        containerURL,
        getUniqueName(`${prefix}${i}${delimiter}${i}`)
      );
      const blockBlobURL = BlockBlobURL.fromBlobURL(blobURL);
      await blockBlobURL.upload("", 0, {
        metadata
      });
      blobURLs.push(blobURL);
    }

    const result = await containerURL.listBlobHierarchySegment(
      delimiter,
      undefined,
      {
        include: [
          ListBlobsIncludeItem.Metadata,
          ListBlobsIncludeItem.Uncommittedblobs,
          ListBlobsIncludeItem.Copy,
          ListBlobsIncludeItem.Deleted
        ],
        maxresults: 1,
        prefix
      }
    );
    assert.ok(result.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result.containerName));
    assert.deepStrictEqual(result.segment.blobPrefixes!.length, 1);
    assert.deepStrictEqual(result.segment.blobItems!.length, 0);
    assert.ok(blobURLs[0].url.indexOf(result.segment.blobPrefixes![0].name));

    const result2 = await containerURL.listBlobHierarchySegment(
      delimiter,
      result.nextMarker,
      {
        include: [
          ListBlobsIncludeItem.Metadata,
          ListBlobsIncludeItem.Uncommittedblobs,
          ListBlobsIncludeItem.Copy,
          ListBlobsIncludeItem.Deleted
        ],
        maxresults: 2,
        prefix
      }
    );
    assert.ok(result2.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result2.containerName));
    assert.deepStrictEqual(result2.segment.blobPrefixes!.length, 1);
    assert.deepStrictEqual(result2.segment.blobItems!.length, 0);
    assert.ok(blobURLs[0].url.indexOf(result2.segment.blobPrefixes![0].name));

    const result3 = await containerURL.listBlobHierarchySegment(
      delimiter,
      undefined,
      {
        include: [
          ListBlobsIncludeItem.Metadata,
          ListBlobsIncludeItem.Uncommittedblobs,
          ListBlobsIncludeItem.Copy,
          ListBlobsIncludeItem.Deleted
        ],
        maxresults: 2,
        prefix: `${prefix}0${delimiter}`
      }
    );
    assert.ok(result3.serviceEndpoint.length > 0);
    assert.ok(containerURL.url.indexOf(result3.containerName));
    assert.deepStrictEqual(result3.nextMarker, "");
    assert.deepStrictEqual(result3.delimiter, delimiter);
    assert.deepStrictEqual(result3.segment.blobItems!.length, 1);
    assert.deepStrictEqual(result3.segment.blobItems![0].metadata, metadata);
    assert.ok(blobURLs[0].url.indexOf(result3.segment.blobItems![0].name));

    for (const blob of blobURLs) {
      await blob.delete();
    }
  });
});

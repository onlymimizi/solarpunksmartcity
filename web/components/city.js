(function(){
  const W = window;
  let scene, camera, renderer, group, frame = 0;

  function init() {
    const el = document.getElementById("viewport");
    const width = el.clientWidth;
    const height = el.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f14);

    camera = new THREE.PerspectiveCamera(55, width/height, 0.1, 1000);
    camera.position.set(40, 35, 40);
    camera.lookAt(0,0,0);

    renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setSize(width, height);
    el.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xbfd8ff, 0.6);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(30,50,20);
    scene.add(dir);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200,200),
      new THREE.MeshStandardMaterial({ color: 0x0e2016, metalness:0.1, roughness:0.9 })
    );
    ground.rotation.x = -Math.PI/2;
    scene.add(ground);

    group = new THREE.Group();
    scene.add(group);

    window.addEventListener("resize", onResize);
    animate();
  }

  function onResize() {
    const el = document.getElementById("viewport");
    const width = el.clientWidth, height = el.clientHeight;
    camera.aspect = width/height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function rand(seed) {
    // simple LCG for repeatability
    let s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return () => (s = s * 16807 % 2147483647) / 2147483647;
  }

  function makeSolarPanel(w, d) {
    const geo = new THREE.PlaneGeometry(w*0.8, d*0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1e90ff, emissive: 0x072f5f, metalness:0.8, roughness:0.2, side: THREE.DoubleSide });
    const p = new THREE.Mesh(geo, mat);
    p.rotation.x = -Math.PI/2 + 0.15;
    p.position.y = 0.02;
    return p;
  }

  function generateCity(opts) {
    const {
      seed = 42,
      grid = 6,
      spacing = 6,
      maxH = 16,
      greenRatio = 0.6
    } = opts || {};

    // clear
    while(group.children.length) group.remove(group.children[0]);

    const rnd = rand(seed);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x13324a, metalness:0.6, roughness:0.4 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x0fbf6d, metalness:0.2, roughness:0.8 });

    for (let x=0; x<grid; x++) {
      for (let z=0; z<grid; z++) {
        const w = 2 + rnd()*2.5;
        const d = 2 + rnd()*2.5;
        const h = 2 + rnd()*maxH;

        const geo = new THREE.BoxGeometry(w, h, d);
        const b = new THREE.Mesh(geo, baseMat.clone());
        b.position.set((x - grid/2) * spacing, h/2, (z - grid/2)*spacing);
        b.material.color.offsetHSL(0, 0, rnd()*0.1);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(w*1.01, 0.04, d*1.01), greenMat);
        roof.position.set(0, h/2 + 0.02, 0);
        b.add(roof);

        if (rnd() < 0.85) {
          const panel = makeSolarPanel(w, d);
          panel.position.y = h/2 + 0.04;
          panel.rotation.z = (rnd()-0.5)*0.2;
          b.add(panel);
        }

        // wind micro-turbine
        if (rnd() < 0.2) {
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.2,8), new THREE.MeshStandardMaterial({color:0xcccccc}));
          mast.position.set(0, h/2 + 0.8, d*0.3);
          const blades = new THREE.Mesh(new THREE.ConeGeometry(0.25,0.35,12), new THREE.MeshStandardMaterial({color:0xffffff, metalness:0.3}));
          blades.position.y = 0.6;
          blades.rotation.x = Math.PI/2;
          mast.add(blades);
          b.add(mast);
        }

        group.add(b);
      }
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    frame++;
    if (group) group.rotation.y += 0.0015;
    renderer.render(scene, camera);
  }

  // Public API
  W.SolarpunkCity = {
    init,
    generateCity
  };
})();